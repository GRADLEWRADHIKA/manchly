import { createCoreReads } from "../core/reads.mjs";
import { createCoreApi } from "../core/api.mjs";
import { HotUpdaterConfigError } from "./configError.mjs";
import { checkReservedId } from "../plugins/official.mjs";
import { clientPluginsOf } from "./clientPlugins.mjs";
import { createEngine } from "@hot-updater/plugin-core";
//#region src/assembly/assemblePlugins.ts
const PLUGIN_KEYS = /* @__PURE__ */ new Set([
	"id",
	"provides",
	"schemaVersion",
	"schema",
	"namespace",
	"init",
	"cli"
]);
const CLI_KEYS = /* @__PURE__ */ new Set(["clientCredential", "clientPlugin"]);
const INSTANCE_KEYS = /* @__PURE__ */ new Set([
	"api",
	"endpoints",
	"clientAuth"
]);
const METHODS = /* @__PURE__ */ new Set([
	"GET",
	"POST",
	"PUT",
	"PATCH",
	"DELETE"
]);
/** An id that prefixes table names is a SQL name; one that does not may use camelCase. */
const PREFIX_ID = /^[a-z][a-z0-9_]*$/u;
const UNPREFIXED_ID = /^[a-z][A-Za-z0-9_]*$/u;
const PATH = /^(\/(:?[A-Za-z0-9_.~-]+))+$/u;
const fail = (message) => {
	throw new HotUpdaterConfigError(message);
};
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const checkPlugin = (value, at) => {
	if (!isRecord(value)) return fail(`${at} is not a plugin.`);
	const unknown = Object.keys(value).find((key) => !PLUGIN_KEYS.has(key));
	if (unknown !== void 0) fail(`${at} has an unknown key "${unknown}".`);
	const plugin = value;
	if (plugin.namespace !== void 0 && plugin.namespace !== false) fail(`${at} may only set namespace: false.`);
	const pattern = plugin.namespace === false ? UNPREFIXED_ID : PREFIX_ID;
	if (typeof plugin.id !== "string" || !pattern.test(plugin.id)) fail(`${at} needs an id matching ${pattern.source}.`);
	if (plugin.id === "core") fail(`${at} uses the id "core", which is core's own.`);
	checkReservedId(value, at);
	if (typeof plugin.schemaVersion !== "string" || !isRecord(plugin.schema) || typeof plugin.init !== "function") fail(`Plugin "${plugin.id}" needs a schemaVersion, a schema, and init.`);
	const provides = plugin.provides;
	if (provides !== void 0 && (!isRecord(provides) || Object.entries(provides).some(([key, flag]) => key !== "clientAuth" || flag !== true))) fail(`Plugin "${plugin.id}" may only declare provides: { clientAuth: true }.`);
	const cli = value.cli;
	if (cli !== void 0) {
		if (!isRecord(cli) || Object.keys(cli).some((key) => !CLI_KEYS.has(key))) fail(`Plugin "${plugin.id}" cli may only hold clientCredential and clientPlugin.`);
		if (cli.clientCredential !== void 0 && plugin.provides?.clientAuth !== true) fail(`Plugin "${plugin.id}" adds cli.clientCredential without declaring provides: { clientAuth: true }.`);
	}
	return plugin;
};
const checkEndpoint = (id, value) => {
	const endpoint = isRecord(value) ? value : {};
	if (!METHODS.has(endpoint.method) || typeof endpoint.path !== "string" || !PATH.test(endpoint.path) || endpoint.access !== "client" && endpoint.access !== "admin" || typeof endpoint.handler !== "function") fail(`Plugin "${id}" has an endpoint that needs a method, a path like /name/:param, access "client" or "admin", and a handler.`);
	return {
		...endpoint,
		plugin: id
	};
};
const checkInstance = (plugin, instance) => {
	const { id } = plugin;
	if (!isRecord(instance)) return fail(`Plugin "${id}" init returned no instance.`);
	if (typeof instance.then === "function") fail(`Plugin "${id}" init returned a promise; init must be synchronous.`);
	const unknown = Object.keys(instance).find((key) => !INSTANCE_KEYS.has(key));
	if (unknown !== void 0 || !("api" in instance)) fail(`Plugin "${id}" init must return { api, endpoints?, clientAuth? }${unknown === void 0 ? "" : `, not "${unknown}"`}.`);
	const declared = plugin.provides?.clientAuth === true;
	const clientAuth = instance.clientAuth;
	if (declared !== (clientAuth !== void 0)) fail(declared ? `Plugin "${id}" declares provides: { clientAuth: true } but its instance has no clientAuth.` : `Plugin "${id}" returns clientAuth without declaring provides: { clientAuth: true }.`);
	if (clientAuth !== void 0 && (typeof clientAuth.authenticate !== "function" || !Array.isArray(clientAuth.varyHeaders) || !clientAuth.varyHeaders.every((header) => typeof header === "string"))) fail(`Plugin "${id}" clientAuth needs varyHeaders and authenticate.`);
	const endpoints = instance.endpoints ?? [];
	if (!Array.isArray(endpoints)) fail(`Plugin "${id}" endpoints must be an array.`);
	return {
		api: instance.api,
		clientAuth,
		endpoints: endpoints.map((endpoint) => checkEndpoint(id, endpoint))
	};
};
/**
* Checks every plugin, runs each `init` once against one engine over the
* database, and collects APIs, endpoints, and clientAuth. Core's reads run
* on the same engine, so plugins read core through `ctx.core`.
*/
const assemblePlugins = (value, database, { now = Date.now, storage = { resolveFileUrl: async () => null } } = {}) => {
	if (!Array.isArray(value)) return fail("plugins must be an array of plugins.");
	const plugins = value.map((plugin, position) => checkPlugin(plugin, `plugins[${position}]`));
	const ids = /* @__PURE__ */ new Set();
	for (const { id } of plugins) {
		if (ids.has(id)) fail(`Plugin "${id}" is registered twice.`);
		ids.add(id);
	}
	clientPluginsOf(plugins);
	const engine = createEngine(database, {
		plugins,
		now
	});
	const { onCachedRoutesChange } = database;
	const core = createCoreApi(engine.core, storage, {
		now,
		...onCachedRoutesChange === void 0 ? {} : { onCachedRoutesChange: () => onCachedRoutesChange.call(database) }
	});
	const reads = createCoreReads(engine.core, storage);
	const api = {};
	const endpoints = [];
	let clientAuth;
	for (const plugin of plugins) {
		const instance = checkInstance(plugin, plugin.init({
			db: engine.database(plugin),
			core: reads,
			now
		}));
		if (instance.clientAuth !== void 0) {
			if (clientAuth !== void 0) fail(`Plugins "${clientAuth.plugin}" and "${plugin.id}" both provide clientAuth; keep one.`);
			const provided = instance.clientAuth;
			clientAuth = {
				plugin: plugin.id,
				varyHeaders: provided.varyHeaders,
				authenticate: (headers) => provided.authenticate(headers)
			};
		}
		endpoints.push(...instance.endpoints);
		api[plugin.id] = instance.api;
	}
	return {
		core,
		api,
		endpoints,
		...clientAuth === void 0 ? {} : { clientAuth },
		flush: engine.flush
	};
};
//#endregion
export { HotUpdaterConfigError, assemblePlugins };
