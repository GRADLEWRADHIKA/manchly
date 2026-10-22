let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
let mongodb = require("mongodb");
//#region src/adapters/mongodbAdapter.ts
var MongoTransactionUnsupportedError = class extends Error {
	name = "MongoTransactionUnsupportedError";
	constructor(cause) {
		super("Hot Updater writes in MongoDB transactions, which need a replica set or a sharded cluster.", { cause });
	}
};
/** A single key column is the `_id`; a composite key is a document in key-column order. */
const idOf = (table, key) => table.key.length === 1 ? key[0] : Object.fromEntries(table.key.map((column, at) => [column, key[at]]));
/** A filter on `_id` (never an ObjectId), and on the version when given. */
const byId = (_id, v) => v === void 0 ? { _id } : {
	_id,
	[_hot_updater_plugin_core.DATABASE_VERSION_COLUMN]: v
};
/** MongoDB's TTL monitor deletes a document once its `_expireAt` passes. */
const TTL = {
	name: "_expireAt",
	key: { _expireAt: 1 },
	expireAfterSeconds: 0
};
/** When a row with retention expires; a null retention column never does. */
const expireAt = ({ retention }, row) => {
	const at = row[retention.column];
	return typeof at === "number" ? new Date(at + retention.ms) : null;
};
/** Null columns are left out, so unique indexes skip them as SQL's do. */
const toDocument = (table, row) => ({
	_id: idOf(table, (0, _hot_updater_plugin_core.rowKey)(table, row)),
	...Object.fromEntries(table.columns.flatMap(({ name }) => row[name] === null || row[name] === void 0 ? [] : [[name, row[name]]])),
	...table.retention && { [TTL.name]: expireAt(table, row) }
});
/** `columns op bound` over a tuple prefix, expanded into ORs. */
const compare = (columns, { values, inclusive }, op) => {
	const terms = values.map((value, position) => ({
		...Object.fromEntries(columns.slice(0, position).map((column, at) => [column, values[at]])),
		[columns[position]]: { [position === values.length - 1 && inclusive ? `${op}e` : op]: value }
	}));
	return terms.length === 1 ? terms[0] : { $or: terms };
};
const indexDescription = (table, index) => {
	const columns = index.unique ? index.eq : [...index.eq, ...(0, _hot_updater_plugin_core.indexOrderColumns)(table, index)];
	const exists = columns.filter((column) => (0, _hot_updater_plugin_core.findPhysicalColumn)(table, column).nullable).map((column) => [column, { $exists: true }]);
	return {
		name: index.name,
		key: Object.fromEntries(columns.map((column) => [column, 1])),
		...index.unique && { unique: true },
		...index.unique && exists.length > 0 && { partialFilterExpression: Object.fromEntries(exists) }
	};
};
const mongoError = (error) => error instanceof mongodb.MongoError ? error : void 0;
/**
* The storage engine's adapter over MongoDB: one collection per table, the
* key as `_id`, and indexes as declared, with multi-valued fields as multikey
* indexes. A write runs in one transaction. Guards are conditional updates,
* and `check` is a conditional `$inc`: a real write, so a concurrent
* transaction on the document conflicts.
*/
const createMongoAdapter = (options) => {
	const { client, tablePrefix = "", maxOps = 1e3 } = options;
	const collection = (table) => client.db().collection(tablePrefix + table.name);
	const normalize = (table, document) => (0, _hot_updater_plugin_core.normalizeStoredRow)(table, document, { jsonText: false });
	/** Whether the op applied; a guard that no longer matches changes nothing. */
	const apply = async (op, session) => {
		const target = collection(op.table);
		if (op.type === "insert") {
			await target.insertOne(toDocument(op.table, op.row), { session });
			return true;
		}
		const _id = idOf(op.table, op.key);
		const update = async (filter, change) => (await target.updateOne(filter, change, { session })).matchedCount === 1;
		switch (op.type) {
			case "patch": {
				const $set = { [_hot_updater_plugin_core.DATABASE_VERSION_COLUMN]: op.guard.v + 1 };
				const $unset = {};
				for (const [name, value] of Object.entries(op.set)) if (value === null) $unset[name] = "";
				else $set[name] = value;
				if (op.table.retention) $set[TTL.name] = expireAt(op.table, {
					...op.previous,
					...op.set
				});
				return update(byId(_id, op.guard.v), {
					$set,
					$unset
				});
			}
			case "delete": return (await target.deleteOne(byId(_id, op.guard.v), { session })).deletedCount === 1;
			case "check": return update(byId(_id, op.guard.v), { $inc: { _checked: 1 } });
			case "increment": {
				if (op.init === void 0 || op.guard !== void 0) return update(byId(_id, op.guard?.v), { $inc: {
					...op.by,
					[_hot_updater_plugin_core.DATABASE_VERSION_COLUMN]: 1
				} });
				const set = {};
				for (const { name } of op.table.columns) {
					const start = op.init[name] ?? null;
					const by = name === _hot_updater_plugin_core.DATABASE_VERSION_COLUMN ? 1 : op.by[name];
					const stored = { $ifNull: [`$${name}`, { $literal: start ?? 0 }] };
					if (by !== void 0) set[name] = { $add: [stored, by] };
					else if (start !== null) set[name] = stored;
				}
				if (op.table.retention) set[TTL.name] = expireAt(op.table, op.init);
				await target.updateOne(byId(_id), [{ $set: set }], {
					upsert: true,
					session
				});
				return true;
			}
		}
	};
	return {
		id: "mongodb",
		fits: (ops) => ops.length <= maxOps,
		async get(table, keys) {
			if (keys.length === 0) return [];
			const ids = keys.map((key) => idOf(table, key));
			const documents = await collection(table).find(byId({ $in: ids })).toArray();
			const found = new Map(documents.map((document) => [JSON.stringify(document._id), document]));
			return ids.map((id) => {
				const document = found.get(JSON.stringify(id));
				return document === void 0 ? null : normalize(table, document);
			});
		},
		async query(table, request) {
			const index = (0, _hot_updater_plugin_core.findPhysicalIndex)(table, request.index);
			const columns = (0, _hot_updater_plugin_core.indexOrderColumns)(table, index);
			const bounds = [...request.lower ? [compare(columns, request.lower, "$gt")] : [], ...request.upper ? [compare(columns, request.upper, "$lt")] : []];
			const direction = request.order === "asc" ? 1 : -1;
			return (await collection(table).find({
				...Object.fromEntries(index.eq.map((column, at) => [column, request.eq[at]])),
				...bounds.length > 0 && { $and: bounds }
			}, {
				sort: Object.fromEntries(columns.map((column) => [column, direction])),
				limit: request.limit,
				...options.batchSize && { batchSize: options.batchSize }
			}).toArray()).map((document) => normalize(table, document));
		},
		async write(ops) {
			const session = client.startSession();
			let position = 0;
			try {
				session.startTransaction({
					readConcern: { level: "snapshot" },
					writeConcern: { w: "majority" }
				});
				for (; position < ops.length; position += 1) if (!await apply(ops[position], session)) {
					await session.abortTransaction();
					return {
						ok: false,
						failedOp: position
					};
				}
				await session.commitTransaction().catch(async (error) => {
					if (!mongoError(error)?.hasErrorLabel("UnknownTransactionCommitResult")) throw error;
					await session.commitTransaction();
				});
				return { ok: true };
			} catch (error) {
				if (session.inTransaction()) await session.abortTransaction().catch(() => void 0);
				const failure = mongoError(error);
				if (failure?.hasErrorLabel("TransientTransactionError") || failure?.code === 112) return {
					ok: false,
					retry: true
				};
				if (failure?.code === 11e3 && position < ops.length) return ops[position].type === "increment" ? {
					ok: false,
					retry: true
				} : {
					ok: false,
					failedOp: position
				};
				throw failure?.code === 20 ? new MongoTransactionUnsupportedError(error) : error;
			} finally {
				await session.endSession();
			}
		},
		migrations: { async apply(tables) {
			for (const table of tables) {
				await client.db().createCollection(tablePrefix + table.name).catch((error) => {
					if (mongoError(error)?.code !== 48) throw error;
				});
				if (table.retention) await collection(table).createIndexes([TTL]);
				if (table.indexes.length === 0) continue;
				await collection(table).createIndexes(table.indexes.map((index) => indexDescription(table, index)));
			}
		} }
	};
};
//#endregion
exports.MongoTransactionUnsupportedError = MongoTransactionUnsupportedError;
exports.createMongoAdapter = createMongoAdapter;
