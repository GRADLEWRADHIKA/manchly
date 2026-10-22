//#region src/server/apiKeys.ts
const API_KEY_HEADER_NAME = "x-api-key";
const BASE64URL_32_PATTERN = /^[A-Za-z0-9_-]{43}$/u;
const bytesToBase64Url = (bytes) => {
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
};
const isApiKey = (value) => {
	if (!BASE64URL_32_PATTERN.test(value)) return false;
	try {
		const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
		const binary = atob(`${base64}=`);
		const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
		return bytes.byteLength === 32 && bytesToBase64Url(bytes) === value;
	} catch {
		return false;
	}
};
const normalizeApiKeyHeaderName = (value = API_KEY_HEADER_NAME) => {
	if (typeof value !== "string" || value.length === 0) throw new TypeError("apiKeys({ headerName }) must name a valid header.");
	try {
		const headers = new Headers();
		headers.set(value, "");
		return headers.keys().next().value;
	} catch {
		throw new TypeError("apiKeys({ headerName }) must name a valid header.");
	}
};
const hashApiKey = async (apiKey) => {
	if (!isApiKey(apiKey)) throw new TypeError("API key must be a canonical 32-byte base64url value.");
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(apiKey));
	return bytesToBase64Url(new Uint8Array(digest));
};
const apiKeyId = () => {
	const bytes = /* @__PURE__ */ new Uint8Array(16);
	crypto.getRandomValues(bytes);
	return `api-${bytesToBase64Url(bytes)}`;
};
const normalizeApiKeyName = (name) => {
	const normalized = name.trim();
	if (normalized.length === 0 || normalized.length > 64 || /[\p{Cc}\p{Cf}]/u.test(normalized)) throw new TypeError("API key names must contain 1-64 visible characters.");
	return normalized;
};
const toApiKeyMetadata = ({ hash: _hash, ...metadata }) => Object.freeze(metadata);
const registerApiKey = async (input) => {
	const hash = await hashApiKey(input.apiKey);
	const createdAtMs = input.createdAtMs ?? Date.now();
	if (!Number.isSafeInteger(createdAtMs) || createdAtMs < 0) throw new TypeError("API key creation time must be non-negative.");
	const record = Object.freeze({
		created_at_ms: createdAtMs,
		hash,
		id: apiKeyId(),
		name: normalizeApiKeyName(input.name),
		prefix: input.apiKey.slice(0, 6),
		revoked_at_ms: null,
		role: "client"
	});
	if (await input.apiKeys.create(record) === "existing") {
		const existing = await input.apiKeys.findByHash(hash);
		if (existing === null || existing.revoked_at_ms !== null) throw new Error("The API key has been revoked.");
		return Object.freeze({
			apiKey: input.apiKey,
			record: toApiKeyMetadata(existing)
		});
	}
	return Object.freeze({
		apiKey: input.apiKey,
		record: toApiKeyMetadata(record)
	});
};
const createApiKey = (input) => {
	const bytes = /* @__PURE__ */ new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return registerApiKey({
		apiKey: bytesToBase64Url(bytes),
		apiKeys: input.apiKeys,
		name: input.name
	});
};
/**
* Provisions the client API key used by managed init.
*
* A saved plaintext key is registered idempotently; otherwise a new key is
* created. Callers must persist or display the returned plaintext because the
* database stores only its hash.
*/
const provisionApiKey = (input) => {
	const existingApiKey = input.existingApiKey?.trim();
	return existingApiKey ? registerApiKey({
		apiKey: existingApiKey,
		apiKeys: input.apiKeys,
		name: input.name
	}) : createApiKey({
		apiKeys: input.apiKeys,
		name: input.name
	});
};
const authenticateApiKey = async (input) => {
	const apiKey = input.request.headers.get(normalizeApiKeyHeaderName(input.headerName));
	if (apiKey === null || !isApiKey(apiKey)) return false;
	const hash = await hashApiKey(apiKey);
	const record = await input.apiKeys.findByHash(hash);
	return record !== null && record.hash === hash && record.role === "client" && record.revoked_at_ms === null;
};
const createApiKeyManagement = (input) => Object.freeze({
	async create({ name }) {
		const created = await createApiKey({
			apiKeys: input.apiKeys,
			name
		});
		return Object.freeze({
			apiKey: created.apiKey,
			record: created.record
		});
	},
	async list() {
		return Object.freeze((await input.apiKeys.list()).map(toApiKeyMetadata));
	},
	async revoke({ id }) {
		const record = await input.apiKeys.revoke({
			id,
			revokedAtMs: Date.now()
		});
		return record === null ? null : toApiKeyMetadata(record);
	}
});
//#endregion
export { API_KEY_HEADER_NAME, apiKeyId, authenticateApiKey, createApiKey, createApiKeyManagement, hashApiKey, isApiKey, normalizeApiKeyHeaderName, normalizeApiKeyName, provisionApiKey, registerApiKey };
