const require_verifyAdapter = require("../../database/verifyAdapter.cjs");
const require_engineReads = require("./engineReads.cjs");
const require_engineTransaction = require("./engineTransaction.cjs");
//#region src/engine/database/engine.ts
/** Storage semantics over one adapter, addressed by physical table name. */
const createStorageEngine = ({ adapter: given, schema, maxPageSize, verify, retry }) => {
	const verified = verify ? require_verifyAdapter.verifyAdapter(given) : void 0;
	const adapter = verified ?? given;
	const reads = require_engineReads.createEngineReads({
		adapter,
		schema,
		maxPageSize
	});
	const { transaction } = require_engineTransaction.createTransactions({
		adapter,
		schema,
		reads,
		retry
	});
	return {
		reads,
		transaction,
		/** Runs `read` and reports what it read at both boundaries (verify mode only). */
		async measureReads(read) {
			if (verified === void 0) throw new Error("measureReads needs an engine created with verify: true.");
			verified.reads.reset();
			reads.reads.reset();
			return {
				result: await read(),
				adapter: verified.reads.total(),
				engine: reads.reads.total()
			};
		}
	};
};
//#endregion
exports.createStorageEngine = createStorageEngine;
