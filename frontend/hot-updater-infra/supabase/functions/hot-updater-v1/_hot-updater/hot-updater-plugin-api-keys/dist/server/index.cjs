Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_apiKeys = require("./apiKeys.cjs");
const require_cli = require("./cli.cjs");
const require_model = require("./model.cjs");
const require_official = require("./official.cjs");
const require_schema = require("./schema.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/server/index.ts
/**
* API keys: protects client routes with keys whose SHA-256 digests
* are stored, and manages them in-process.
*/
const apiKeys = (options = {}) => {
	const headerName = require_apiKeys.normalizeApiKeyHeaderName(options.headerName ?? "x-api-key");
	const plugin = (0, _hot_updater_plugin_core.definePlugin)({
		id: "apiKeys",
		namespace: false,
		provides: { clientAuth: true },
		schemaVersion: "1.0.0",
		schema: require_schema.apiKeysSchema,
		init: ({ db }) => {
			const model = require_model.createApiKeyModel(db);
			return {
				api: {
					...require_apiKeys.createApiKeyManagement({ apiKeys: model }),
					/** Registers a known plaintext key idempotently, for managed init. */
					register: (input) => require_apiKeys.registerApiKey({
						...input,
						apiKeys: model
					}),
					/** Reuses a saved key or creates one, for managed init. */
					provision: (input) => require_apiKeys.provisionApiKey({
						...input,
						apiKeys: model
					})
				},
				clientAuth: {
					varyHeaders: [headerName],
					authenticate: (headers) => require_apiKeys.authenticateApiKey({
						apiKeys: model,
						headerName,
						request: { headers }
					})
				}
			};
		},
		cli: require_cli.apiKeysCli(headerName)
	});
	return require_official.markOfficial(plugin);
};
//#endregion
exports.API_KEY_HEADER_NAME = require_apiKeys.API_KEY_HEADER_NAME;
exports.apiKeys = apiKeys;
exports.apiKeysSchema = require_schema.apiKeysSchema;
exports.createApiKeyModel = require_model.createApiKeyModel;
