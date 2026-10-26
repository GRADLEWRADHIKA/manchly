import { HOT_UPDATER_SERVER_VERSION } from "./version.mjs";
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
		version: HOT_UPDATER_SERVER_VERSION
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
export { HOT_UPDATER_INFRASTRUCTURE_GENERATION, createVersionRouteHandlers };
