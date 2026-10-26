const require_databaseConfig = require("./databaseConfig.cjs");
//#region src/types/index.ts
/**
* Supported Apple platforms for building and deployment
*/
const supportedIosPlatforms = { ios: "ios" };
//#endregion
exports.isRemoteDatabase = require_databaseConfig.isRemoteDatabase;
exports.supportedIosPlatforms = supportedIosPlatforms;
