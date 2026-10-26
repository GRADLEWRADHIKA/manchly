import { defineTable } from "@hot-updater/plugin-core";
//#region src/server/schema.ts
/** v1's `api_keys` columns; the plaintext key is never stored, only its SHA-256 digest. */
const apiKeysSchema = { api_keys: defineTable({
	id: {
		type: "string",
		maxLength: 255
	},
	hash: {
		type: "string",
		maxLength: 64,
		unique: true
	},
	name: {
		type: "string",
		maxLength: 64
	},
	prefix: {
		type: "string",
		maxLength: 16
	},
	role: {
		type: "string",
		maxLength: 16
	},
	created_at_ms: { type: "integer" },
	revoked_at_ms: {
		type: "integer",
		required: false
	}
}, {
	key: ["id"],
	indexes: { byCreated: {
		eq: [],
		sort: ["created_at_ms"]
	} }
}) };
//#endregion
export { apiKeysSchema };
