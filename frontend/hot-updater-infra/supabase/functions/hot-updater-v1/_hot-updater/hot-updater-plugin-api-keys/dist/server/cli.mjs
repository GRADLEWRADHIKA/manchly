//#region src/server/cli.ts
/** The environment variable init stores the app's API key in. */
const API_KEY_ENV = "HOT_UPDATER_API_KEY";
/** A new API key: 32 random bytes, base64url, as the plugin creates them. */
const generateApiKey = () => {
	const bytes = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(32));
	return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
};
/** The API key that init provisions for an app, sent in `headerName`. */
const apiKeysCli = (headerName) => ({ clientCredential: {
	label: "API key",
	header: headerName,
	env: API_KEY_ENV,
	generate: generateApiKey,
	provision: async (api, { existing, name }) => (await api.provision({
		...existing === void 0 ? {} : { existingApiKey: existing },
		name
	})).apiKey
} });
//#endregion
export { API_KEY_ENV, apiKeysCli };
