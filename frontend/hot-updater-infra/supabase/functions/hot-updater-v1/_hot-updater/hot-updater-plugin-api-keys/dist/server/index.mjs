import { API_KEY_HEADER_NAME, authenticateApiKey, createApiKeyManagement, normalizeApiKeyHeaderName, provisionApiKey, registerApiKey } from "./apiKeys.mjs";
import { apiKeysCli } from "./cli.mjs";
import { createApiKeyModel } from "./model.mjs";
import { markOfficial } from "./official.mjs";
import { apiKeysSchema } from "./schema.mjs";
import { definePlugin } from "@hot-updater/plugin-core";
//#region src/server/index.ts
/**
* API keys: protects client routes with keys whose SHA-256 digests
* are stored, and manages them in-process.
*/
const apiKeys = (options = {}) => {
	const headerName = normalizeApiKeyHeaderName(options.headerName ?? "x-api-key");
	const plugin = definePlugin({
		id: "apiKeys",
		namespace: false,
		provides: { clientAuth: true },
		schemaVersion: "1.0.0",
		schema: apiKeysSchema,
		init: ({ db }) => {
			const model = createApiKeyModel(db);
			return {
				api: {
					...createApiKeyManagement({ apiKeys: model }),
					/** Registers a known plaintext key idempotently, for managed init. */
					register: (input) => registerApiKey({
						...input,
						apiKeys: model
					}),
					/** Reuses a saved key or creates one, for managed init. */
					provision: (input) => provisionApiKey({
						...input,
						apiKeys: model
					})
				},
				clientAuth: {
					varyHeaders: [headerName],
					authenticate: (headers) => authenticateApiKey({
						apiKeys: model,
						headerName,
						request: { headers }
					})
				}
			};
		},
		cli: apiKeysCli(headerName)
	});
	return markOfficial(plugin);
};
//#endregion
export { API_KEY_HEADER_NAME, apiKeys, apiKeysSchema, createApiKeyModel };
