import { verifyAdapter } from "../../database/verifyAdapter.mjs";
import { createEngineReads } from "./engineReads.mjs";
import { createTransactions } from "./engineTransaction.mjs";
//#region src/engine/database/engine.ts
/** Storage semantics over one adapter, addressed by physical table name. */
const createStorageEngine = ({ adapter: given, schema, maxPageSize, verify, retry }) => {
	const verified = verify ? verifyAdapter(given) : void 0;
	const adapter = verified ?? given;
	const reads = createEngineReads({
		adapter,
		schema,
		maxPageSize
	});
	const { transaction } = createTransactions({
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
export { createStorageEngine };
