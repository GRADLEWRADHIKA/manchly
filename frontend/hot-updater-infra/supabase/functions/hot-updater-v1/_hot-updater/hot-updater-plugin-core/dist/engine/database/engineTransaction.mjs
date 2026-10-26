import { DatabaseAmbiguousCommitError, DatabaseConflictError, DatabaseConstraintError, DatabaseQueryError, DatabaseTransactionError } from "../../serverPlugin/errors.mjs";
import { rowKey } from "../../database/adapter.mjs";
import { canonicalJson, compareTuples, indexEntries } from "../../database/values.mjs";
import { NegativeGaugeError, compileAggregates, recordAggregate } from "./engineAggregates.mjs";
//#region src/engine/database/engineTransaction.ts
/** A row this attempt read changed while it ran; the attempt reruns. */
var StaleReadError = class extends Error {};
const idOf = (table, key) => JSON.stringify([table, key]);
const versionOf = (row) => Number(row["_v"]);
const isKeyed = (value) => value !== null && value !== void 0;
const misuse = (table, message) => new DatabaseTransactionError(`${table}: ${message}`);
const once = (table) => misuse(table, "a transaction writes one key once.");
const hooks = globalThis.process?.getBuiltinModule?.("node:async_hooks");
/** Where the runtime tracks async context, `db.*` inside a transaction throws. */
const transactionScope = hooks && new hooks.AsyncLocalStorage();
const assertOutsideTransaction = () => {
	if (transactionScope?.getStore() !== void 0) throw new DatabaseTransactionError("Inside transaction(), read and write through its handle; db and core are not part of it.");
};
const createTransactions = ({ adapter, schema, reads, retry = {} }) => {
	const { attempts = 8, baseDelayMs = 5, maxDelayMs = 250, onRetry } = retry;
	const { modelOf } = reads;
	/**
	* A key-value index copy has no `_v`. A transaction guards what it reads,
	* so it reads such a row whole, and reruns if it changed since the copy.
	*/
	const complete = async ({ table }, rows) => {
		const copies = rows.filter((row) => !("_v" in row));
		if (copies.length === 0) return [...rows];
		const current = await adapter.get(table, copies.map((copy) => rowKey(table, copy)));
		return rows.map((row) => {
			const at = copies.indexOf(row);
			if (at < 0) return row;
			const whole = current[at];
			if (!whole || Object.keys(row).some((column) => canonicalJson(row[column]) !== canonicalJson(whole[column]))) throw new StaleReadError();
			return whole;
		});
	};
	const attempt = async (fn) => {
		const read = /* @__PURE__ */ new Map();
		/** Rows of rooted ranges: their root guards them, so they need no check of their own. */
		const ranged = /* @__PURE__ */ new Map();
		const writes = /* @__PURE__ */ new Map();
		/** Deleted keys, children before their parents. */
		const deleted = [];
		const aggregates = /* @__PURE__ */ new Map();
		let open = true;
		let failure;
		/** A failed call fails the attempt even when `fn` catches it. */
		const step = (method) => (...args) => {
			if (!open) throw new DatabaseTransactionError("The transaction has ended.");
			const fail = (error) => {
				failure ??= { error };
				throw error;
			};
			try {
				const result = method(...args);
				return result instanceof Promise ? result.catch(fail) : result;
			} catch (error) {
				return fail(error);
			}
		};
		const remember = (model, key, row) => {
			const id = idOf(model.table.name, key);
			const known = read.get(id);
			if (known !== void 0 && (known && row ? versionOf(known) !== versionOf(row) : known !== row)) throw new StaleReadError();
			read.set(id, row);
			return row;
		};
		const readRow = ({ table }, row) => {
			const id = idOf(table.name, rowKey(table, row));
			const known = read.get(id) ?? ranged.get(id);
			if (known && versionOf(known) === versionOf(row)) return known;
			throw misuse(table.name, "update and delete take a row this transaction read.");
		};
		const checkFields = ({ table, definition: { fields } }, values, creating) => {
			for (const field of Object.keys(values)) if (!(field in fields) || !creating && table.key.includes(field)) throw misuse(table.name, `${field} cannot be ${creating ? "set" : "changed"}.`);
			for (const [field, { required }] of Object.entries(fields)) if (required !== false && (creating || field in values) && !isKeyed(values[field])) throw misuse(table.name, `${field} is required.`);
		};
		/** Adds counter deltas to a key's pending op; an empty `by` still bumps `_v`. */
		const bump = (model, key, by) => {
			const id = idOf(model.table.name, key);
			const pending = writes.get(id);
			if (pending === void 0) writes.set(id, {
				model,
				key,
				type: "increment",
				row: { ...by }
			});
			else if (pending.type !== "delete") for (const [column, delta] of Object.entries(by)) pending.row[column] = Number(pending.row[column] ?? pending.read?.[column] ?? 0) + delta;
			else if (Object.values(by).some((delta) => delta > 0)) throw new DatabaseConstraintError("not_found", model.table.name);
		};
		/** Moves parent counters when a reference changes and bumps every rooted parent. */
		const touchParents = (model, before, after) => {
			for (const { field, counter, target } of model.references) {
				const [from, to] = [before?.[field], after?.[field]];
				if (counter === void 0 || from === to) continue;
				if (isKeyed(from)) bump(modelOf(target), [from], { [counter]: -1 });
				if (isKeyed(to)) bump(modelOf(target), [to], { [counter]: 1 });
			}
			for (const [index, root] of model.roots) {
				const parent = modelOf(root);
				const { eq } = model.table.indexes.find(({ name }) => name === index);
				for (const row of [before, after]) {
					const key = eq.slice(0, parent.table.key.length).map((field) => row?.[field]);
					if (row && key.every(isKeyed)) bump(parent, key, {});
				}
			}
		};
		const derive = ({ definition }, row) => {
			if (definition.kind === "table") for (const [name, derived] of Object.entries(definition.derived)) row[name] = derived.compute(row);
			return row;
		};
		/** Deletes a row after its cascaded children, or refuses a restricted delete. */
		const remove = async (model, known) => {
			const { table } = model;
			const key = rowKey(table, known);
			const id = idOf(table.name, key);
			const pending = writes.get(id);
			if (pending?.type === "delete") return;
			if (pending && pending.type !== "increment") throw once(table.name);
			writes.set(id, {
				model,
				key,
				type: "delete",
				row: {},
				read: known
			});
			touchParents(model, known, null);
			for (const reference of model.referencedBy) {
				const { counter, field, onDelete, table: name } = reference;
				if (counter === void 0) continue;
				const stored = Number(known[counter] ?? 0);
				const added = Number(pending?.row[counter] ?? 0);
				if (added > 0) throw new DatabaseConstraintError("referenced", table.name);
				if (stored + added <= 0) continue;
				if (onDelete === "restrict") {
					const [current] = await adapter.get(table, [key]);
					if (current && versionOf(current) === versionOf(known)) throw new DatabaseConstraintError("referenced", table.name);
					throw new StaleReadError();
				}
				const child = modelOf(name);
				const index = child.table.indexes.find(({ eq }) => eq.length === 1 && eq[0] === field);
				let cursor;
				let seen = 0;
				do {
					const page = await reads.findMany(name, {
						index: index.name,
						where: { [field]: key[0] },
						limit: Math.min(stored - seen, reads.maxPageSize),
						...cursor === void 0 ? {} : { cursor }
					});
					for (const row of await complete(child, page.rows)) {
						remember(child, rowKey(child.table, row), row);
						await remove(child, row);
					}
					seen += page.rows.length;
					cursor = page.next;
				} while (cursor !== void 0 && seen < stored);
			}
			deleted.push(id);
		};
		const tx = {
			findOne: step(async (name, lookup) => {
				const model = modelOf(name);
				const { table } = model;
				const found = await reads.findOne(name, lookup);
				if (found === null && !table.key.every((field) => field in lookup)) return null;
				const [row = null] = found ? await complete(model, [found]) : [];
				const key = row ? rowKey(table, row) : table.key.map((field) => lookup[field]);
				return remember(model, key, row);
			}),
			findMany: step(async (name, input) => {
				const model = modelOf(name);
				const root = model.roots.get(input.index);
				if (root === void 0) throw new DatabaseQueryError(`${name}.${input.index} is not rooted; a transaction reads a range only under a guarded parent.`);
				const parent = modelOf(root);
				const { eq } = model.table.indexes.find(({ name: index }) => index === input.index);
				const where = input.where ?? {};
				const lookup = Object.fromEntries(parent.table.key.map((field, at) => [field, where[eq[at]]]));
				remember(parent, Object.values(lookup), await reads.findOne(root, lookup));
				const found = await reads.findMany(name, input);
				const rows = await complete(model, found.rows);
				for (const row of rows) ranged.set(idOf(name, rowKey(model.table, row)), row);
				return {
					...found,
					rows
				};
			}),
			create: step((name, values) => {
				const model = modelOf(name);
				checkFields(model, values, true);
				const defaults = model.table.columns.flatMap((column) => column.nullable || column.default !== void 0 ? [[column.name, column.default ?? null]] : []);
				const row = derive(model, {
					...Object.fromEntries(defaults),
					...values
				});
				const key = rowKey(model.table, row);
				const id = idOf(name, key);
				const pending = writes.get(id);
				if (pending && pending.type !== "increment") throw once(name);
				for (const [column, delta] of Object.entries(pending?.row ?? {})) row[column] = Number(row[column]) + Number(delta);
				writes.set(id, {
					model,
					key,
					type: "insert",
					row
				});
				touchParents(model, null, row);
			}),
			update: step((name, row, set) => {
				const model = modelOf(name);
				const known = readRow(model, row);
				checkFields(model, set, false);
				const key = rowKey(model.table, known);
				const id = idOf(name, key);
				const pending = writes.get(id);
				if (pending?.type === "insert" || pending?.type === "delete") throw once(name);
				const before = pending?.type === "patch" ? {
					...known,
					...pending.row
				} : known;
				const next = derive(model, {
					...before,
					...set
				});
				const changed = Object.entries(next).filter(([column, value]) => column !== "_v" && JSON.stringify(value) !== JSON.stringify(known[column]));
				const patch = Object.fromEntries(changed);
				writes.set(id, {
					model,
					key,
					type: "patch",
					row: patch,
					read: known
				});
				if (pending?.type === "increment") bump(model, key, pending.row);
				touchParents(model, before, next);
			}),
			delete: step(async (name, row) => {
				const model = modelOf(name);
				await remove(model, readRow(model, row));
			}),
			aggregate: step((name, identity, values, options) => {
				const model = modelOf(name, "aggregate");
				recordAggregate(aggregates, model, identity, values, options?.shardBy);
			})
		};
		try {
			const result = await (transactionScope ? transactionScope.run(tx, () => fn(tx)) : fn(tx));
			if (failure) throw failure.error;
			return {
				result,
				read,
				ops: compile(writes, read, deleted),
				aggregates: [...aggregates.values()]
			};
		} catch (error) {
			throw failure?.error instanceof StaleReadError ? failure.error : error;
		} finally {
			open = false;
		}
	};
	/** Inserts first, then patches and increments, then checks, then deletes, children before parents. */
	const compile = (writes, read, deleted) => {
		const toOp = (id) => {
			const { model, key, type, row, read: previous } = writes.get(id);
			const { table } = model;
			if (type === "insert") return {
				type,
				table,
				row
			};
			if (type === "increment") {
				const known = read.get(id);
				const by = row;
				return known ? {
					type,
					table,
					key,
					by,
					guard: { v: versionOf(known) }
				} : {
					type,
					table,
					key,
					by
				};
			}
			const guard = { v: versionOf(previous) };
			return type === "patch" ? {
				type,
				table,
				key,
				set: row,
				guard,
				previous
			} : {
				type,
				table,
				key,
				guard,
				previous
			};
		};
		const checks = [...read].flatMap(([id, row]) => {
			if (row === null || writes.has(id)) return [];
			const { table } = schema.models.get(JSON.parse(id)[0]);
			const guard = { v: versionOf(row) };
			return [{
				type: "check",
				table,
				key: rowKey(table, row),
				guard
			}];
		});
		const ofType = (...types) => [...writes.keys()].filter((id) => types.includes(writes.get(id).type));
		return [
			...[...ofType("insert"), ...ofType("patch", "increment")].map(toOp),
			...checks,
			...deleted.map(toOp)
		];
	};
	/** Only a constraint the current state confirms is reported; anything else reruns. */
	const classify = async (op, read) => {
		if (op.type === "check" || op.type === "delete") return void 0;
		if (op.type === "increment" && op.guard) return void 0;
		const { table } = op;
		const key = op.type === "insert" ? rowKey(table, op.row) : op.key;
		const [current] = await adapter.get(table, [key]);
		if (op.type === "increment") return current ? void 0 : "not_found";
		if (op.type === "insert" && current) {
			const known = read.get(idOf(table.name, key));
			return known === null || known !== void 0 && versionOf(known) !== versionOf(current) ? void 0 : "exists";
		}
		if (op.type === "patch" && current?.["_v"] !== op.guard.v) return;
		const row = op.type === "insert" ? op.row : {
			...current,
			...op.set
		};
		for (const index of table.indexes) {
			if (!index.unique) continue;
			for (const eq of indexEntries(table, index, row)) if ((await adapter.query(table, {
				index: index.name,
				eq,
				order: "asc",
				limit: 2
			})).some((other) => compareTuples(rowKey(table, other), key))) return "unique";
		}
	};
	return { async transaction(fn) {
		assertOutsideTransaction();
		let run;
		let negative;
		for (let round = 0; round < attempts; round += 1) {
			const delay = round && Math.min(maxDelayMs, baseDelayMs * 2 ** (round - 1));
			if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay / 2 + Math.random() * (delay / 2)));
			run ??= await attempt(fn).catch((error) => {
				if (error instanceof StaleReadError) return void 0;
				throw error;
			});
			if (run === void 0) {
				onRetry?.("rerun", round + 1);
				continue;
			}
			let aggregates;
			try {
				aggregates = await compileAggregates(adapter, run.aggregates);
			} catch (error) {
				if (!(error instanceof NegativeGaugeError)) throw error;
				negative = error;
				onRetry?.("rerun", round + 1);
				run = void 0;
				continue;
			}
			const ops = [...run.ops, ...aggregates];
			if (ops.length <= 1 && ops.every(({ type }) => type === "check")) return run.result;
			if (!adapter.fits(ops)) throw new DatabaseConstraintError("too_large", ops[0].table.name);
			let outcome;
			try {
				outcome = await adapter.write(ops);
			} catch (cause) {
				throw new DatabaseAmbiguousCommitError("The commit outcome is unknown.", { cause });
			}
			if (outcome.ok) return run.result;
			const failed = "failedOp" in outcome ? outcome.failedOp : void 0;
			if (failed === void 0 || failed >= run.ops.length) {
				onRetry?.("resend", round + 1);
				continue;
			}
			const reason = await classify(ops[failed], run.read);
			if (reason) throw new DatabaseConstraintError(reason, ops[failed].table.name);
			onRetry?.("rerun", round + 1);
			run = void 0;
		}
		throw negative ?? new DatabaseConflictError(`The transaction conflicted ${attempts} times.`);
	} };
};
//#endregion
export { assertOutsideTransaction, createTransactions };
