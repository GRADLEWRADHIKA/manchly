//#region src/engine/database/readMeter.ts
const METER = Symbol.for("@hot-updater/plugin-core/read-meter");
const NO_READS = {
	gets: 0,
	keys: 0,
	queries: 0,
	rows: 0
};
/** The meter `meterReads` gave `database`, if it did. */
const readMeterOf = (database) => typeof database === "object" && database !== null ? database[METER] : void 0;
/**
* `database` with read metering, for adapter cost analysis: pass it to
* `createHotUpdater` or `createEngine`, then `measureReads` reports what a
* call read at the adapter and at the engine. It works on any database on
* the storage engine, a provider's included, and every engine on it reports
* to the same meter.
*/
const meterReads = (database) => {
	let adapterReads = NO_READS;
	const engines = /* @__PURE__ */ new Set();
	const add = (count) => {
		adapterReads = {
			gets: adapterReads.gets + (count.gets ?? 0),
			keys: adapterReads.keys + (count.keys ?? 0),
			queries: adapterReads.queries + (count.queries ?? 0),
			rows: adapterReads.rows + (count.rows ?? 0)
		};
	};
	const meter = {
		wrap: (adapter) => Object.assign(Object.create(adapter), {
			async get(...args) {
				const rows = await adapter.get(...args);
				add({
					gets: 1,
					keys: args[1].length
				});
				return rows;
			},
			async query(...args) {
				const rows = await adapter.query(...args);
				add({
					queries: 1,
					rows: rows.length
				});
				return rows;
			}
		}),
		attach: (counter) => {
			engines.add(counter);
		}
	};
	return {
		...database,
		[METER]: meter,
		async measureReads(read) {
			adapterReads = NO_READS;
			for (const engine of engines) engine.reset();
			const result = await read();
			let engine = {
				calls: 0,
				rows: 0
			};
			for (const counter of engines) {
				const total = counter.total();
				engine = {
					calls: engine.calls + total.calls,
					rows: engine.rows + total.rows
				};
			}
			return {
				result,
				adapter: adapterReads,
				engine
			};
		}
	};
};
//#endregion
exports.meterReads = meterReads;
exports.readMeterOf = readMeterOf;
