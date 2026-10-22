//#region src/types/databaseConfig.ts
/** Whether a configured database is a self-hosted server's. */
const isRemoteDatabase = (value) => typeof value === "object" && value !== null && "core" in value && "fetchAdmin" in value;
//#endregion
export { isRemoteDatabase };
