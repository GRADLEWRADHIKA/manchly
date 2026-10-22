//#region src/engine/db/fixedMigratorShared.ts
const getEmptyMigrationResult = () => ({
	operations: [],
	execute: async () => {},
	getSQL: () => ""
});
//#endregion
export { getEmptyMigrationResult };
