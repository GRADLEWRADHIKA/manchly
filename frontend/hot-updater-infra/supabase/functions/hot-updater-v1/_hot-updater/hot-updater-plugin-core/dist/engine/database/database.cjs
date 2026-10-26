require("../../database/adapter.cjs");
const require_aggregateBatching = require("./aggregateBatching.cjs");
const require_engineTransaction = require("./engineTransaction.cjs");
const require_engine = require("./engine.cjs");
//#region src/engine/database/database.ts
/** The engine plus `database(module)`, which hands a module its typed handle. */
const createDatabaseEngine = ({ batching, now = Date.now, meter, ...options }) => {
	const adapter = meter ? meter.wrap(options.adapter) : options.adapter;
	const engine = require_engine.createStorageEngine({
		...options,
		adapter
	});
	const { reads } = engine;
	meter?.attach(reads.reads);
	const batches = batching && require_aggregateBatching.createAggregateBatches({
		engine,
		adapter,
		schema: options.schema,
		batching,
		now
	});
	const transaction = batches?.transaction ?? engine.transaction;
	const outside = (read) => (...args) => {
		require_engineTransaction.assertOutsideTransaction();
		return read(...args);
	};
	/** No read outside a transaction returns `_v`, which a key-value index copy lacks. */
	const bare = (row) => row && Object.fromEntries(Object.entries(row).filter(([column]) => column !== "_v"));
	const barePage = async (page) => {
		const { rows, next } = await page;
		return {
			rows: rows.map(bare),
			...next === void 0 ? {} : { next }
		};
	};
	return {
		...engine,
		/** Applies batched aggregate changes still pending: this process's buffer and the log. */
		flush: async () => {
			await batches?.flush();
		},
		dispose: async () => {
			await batches?.dispose();
		},
		database(module) {
			const name = (model) => module.namespace ? `${module.namespace}_${model}` : model;
			return {
				findOne: outside(async (model, lookup) => bare(await reads.findOne(name(model), lookup))),
				findByKeys: outside(async (model, keys) => (await reads.findByKeys(name(model), keys)).map(bare)),
				findMany: outside((model, input) => barePage(reads.findMany(name(model), input))),
				findAggregates: outside(async (model, input) => {
					await batches?.beforeRead(name(model));
					return await barePage(reads.findAggregates(name(model), input));
				}),
				transaction: (fn) => transaction((tx) => fn({
					findOne: (model, lookup) => tx.findOne(name(model), lookup),
					findMany: (model, input) => tx.findMany(name(model), input),
					create: (model, row) => tx.create(name(model), row),
					update: (model, row, set) => tx.update(name(model), row, set),
					delete: (model, row) => tx.delete(name(model), row),
					aggregate: (model, identity, changes, options) => tx.aggregate(name(model), identity, changes, options)
				}))
			};
		}
	};
};
//#endregion
exports.createDatabaseEngine = createDatabaseEngine;
