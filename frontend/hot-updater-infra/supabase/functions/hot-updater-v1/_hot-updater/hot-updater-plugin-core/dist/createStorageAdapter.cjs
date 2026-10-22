//#region src/createStorageAdapter.ts
const createStorageAdapter = (options) => ({ ...options });
function assertStorageOperations(adapter, operations) {
	for (const operation of operations) if (typeof adapter[operation] !== "function") throw new Error(`Storage adapter "${adapter.name}" does not implement ${operation}.`);
}
//#endregion
exports.assertStorageOperations = assertStorageOperations;
exports.createStorageAdapter = createStorageAdapter;
