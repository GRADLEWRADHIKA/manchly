//#region src/engine/db/fixedMigratorShared.ts
const getEmptyMigrationResult = () => ({
	operations: [],
	execute: async () => {},
	getSQL: () => ""
});
//#endregion
exports.getEmptyMigrationResult = getEmptyMigrationResult;
