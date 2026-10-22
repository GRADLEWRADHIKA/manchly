const require_version = require("./version.cjs");
//#region src/handlerVersionRoutes.ts
const HOT_UPDATER_INFRASTRUCTURE_GENERATION = 1;
/**
* `/version` on both mounts. The admin mount also lists the ids of the
* plugins the server runs, sorted; apps never learn which plugins a server
* runs.
*/
const createVersionRouteHandlers = (plugins = []) => {
	const version = {
		adminProtocol: 2,
		infrastructureGeneration: 1,
		version: require_version.HOT_UPDATER_SERVER_VERSION
	};
	const adminVersion = {
		...version,
		plugins: [...plugins].sort()
	};
	return {
		version: async () => Response.json(version),
		adminVersion: async () => Response.json(adminVersion)
	};
};
//#endregion
exports.HOT_UPDATER_INFRASTRUCTURE_GENERATION = HOT_UPDATER_INFRASTRUCTURE_GENERATION;
exports.createVersionRouteHandlers = createVersionRouteHandlers;
