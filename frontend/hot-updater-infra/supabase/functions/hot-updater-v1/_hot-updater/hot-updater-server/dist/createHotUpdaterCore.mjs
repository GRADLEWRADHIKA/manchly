import { HotUpdaterConfigError } from "./assembly/configError.mjs";
import { clientPluginsOf } from "./assembly/clientPlugins.mjs";
import { assemblePlugins } from "./assembly/assemblePlugins.mjs";
import { createHotUpdaterHandlers } from "./handler.mjs";
import { createStorageAccess } from "./storageAccess.mjs";
import { assertStorageOperations } from "@hot-updater/plugin-core";
//#region src/createHotUpdaterCore.ts
const isRecord = (value) => typeof value === "object" && value !== null;
const isAdapter = (value) => isRecord(value) && [
	"fits",
	"get",
	"query",
	"write"
].every((method) => typeof value[method] === "function");
/** The configured database, when it runs on the storage engine. */
const databaseOf = (value) => {
	if (isRecord(value) && typeof value.name === "string") {
		if (isAdapter(value.adapter)) return value;
		if ("core" in value && "fetchAdmin" in value) throw new HotUpdaterConfigError("standaloneRepository reaches a server's admin API from the CLI and console. createHotUpdater needs the server's own database, such as kyselyAdapter(...).");
	}
	throw new HotUpdaterConfigError("database must be a Hot Updater database adapter, such as kyselyAdapter(...) or postgres(...).");
};
/** The configured storage, when it is a storage adapter. */
const storageOf = (value) => {
	if (isRecord(value) && typeof value.name === "string" && typeof value.protocol === "string") return value;
	throw new HotUpdaterConfigError("storage must be a storage adapter, such as s3Storage(...): the one hot-updater.config.ts uploads with.");
};
/** `"public"`, or nothing. */
const isPublic = (value) => {
	if (value === void 0) return false;
	if (value === "public") return true;
	throw new HotUpdaterConfigError("clientAccess must be \"public\"; to protect client routes, add a plugin that provides clientAuth to plugins.");
};
function createHotUpdater(options) {
	const database = databaseOf(options.database);
	const storage = storageOf(options.storage);
	const { readStorageText, resolveFileUrl } = createStorageAccess(storage);
	const publicClients = isPublic(options.clientAccess);
	const configured = Object.freeze([...options.plugins ?? []]);
	const plugins = assemblePlugins(configured, database, { storage: {
		readStorageText,
		resolveFileUrl
	} });
	const clientPlugins = Object.freeze(clientPluginsOf(configured));
	const clientAuth = plugins.clientAuth;
	if (clientAuth !== void 0 && publicClients) throw new HotUpdaterConfigError(`Plugin "${clientAuth.plugin}" provides clientAuth, so remove clientAccess.`);
	if (clientAuth === void 0 && !publicClients) throw new HotUpdaterConfigError("Set clientAccess to \"public\", or add a plugin that provides clientAuth.");
	const varyHeaders = Object.freeze((clientAuth?.varyHeaders ?? []).map((header) => header.toLowerCase()));
	const clientPolicy = clientAuth === void 0 ? void 0 : {
		varyHeaders,
		authenticate: (request) => clientAuth.authenticate(request.headers)
	};
	const handlers = createHotUpdaterHandlers({
		api: { core: plugins.core },
		...clientPolicy === void 0 ? {} : { clientPolicy },
		endpoints: plugins.endpoints,
		plugins: Object.keys(plugins.api)
	});
	let serving = false;
	return {
		adapterName: database.name,
		get handlers() {
			if (!serving) {
				assertStorageOperations(storage, ["get", "getDownloadUrl"]);
				serving = true;
			}
			return handlers;
		},
		core: plugins.core,
		api: plugins.api,
		flush: plugins.flush,
		database,
		storage,
		plugins: configured,
		clientPlugins,
		clientEndpoints: Object.freeze(plugins.endpoints.filter((endpoint) => endpoint.access === "client").map(({ plugin, method, path }) => Object.freeze({
			plugin,
			method,
			path
		}))),
		...clientAuth === void 0 ? {} : { clientAuth: Object.freeze({
			plugin: clientAuth.plugin,
			varyHeaders
		}) }
	};
}
//#endregion
export { createHotUpdater };
