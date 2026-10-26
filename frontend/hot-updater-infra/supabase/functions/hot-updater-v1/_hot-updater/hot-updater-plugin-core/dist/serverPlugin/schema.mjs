//#region src/serverPlugin/schema.ts
const defineTable = (fields, options) => ({
	kind: "table",
	fields,
	key: options.key,
	derived: options.derived ?? {},
	indexes: options.indexes ?? {},
	...options.retention === void 0 ? {} : { retention: options.retention }
});
const defineAggregate = (fields, options) => ({
	kind: "aggregate",
	fields,
	key: options.key,
	counters: options.counters ?? [],
	gauges: options.gauges ?? [],
	distinct: options.distinct ?? [],
	shards: options.shards ?? 1,
	indexes: options.indexes ?? {},
	...options.batched ? { batched: true } : {},
	...options.retention === void 0 ? {} : { retention: options.retention }
});
//#endregion
export { defineAggregate, defineTable };
