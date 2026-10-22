let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
let _supabase_supabase_js = require("@supabase/supabase-js");
//#region src/supabaseConfig.ts
const resolveSupabaseServiceRoleKey = (config) => {
	if (!config.supabaseServiceRoleKey) throw new Error("Supabase service role key is required. Set supabaseServiceRoleKey.");
	return config.supabaseServiceRoleKey;
};
//#endregion
//#region src/supabaseInfrastructureNames.ts
/** Namespaces Hot Updater's tables beside a project's own, and beside v0's. */
const SUPABASE_TABLE_PREFIX = "hot_updater_v1_";
const SUPABASE_APPLY_FUNCTION = "hot_updater_v1_apply";
"" + _hot_updater_plugin_core.SETTINGS_TABLE.name;
//#endregion
//#region src/supabaseExecutor.ts
/**
* The apply RPC binds one jsonb array, so each placeholder becomes a typed
* read of it, `($1->>k)::bigint`, and a null becomes `NULL`. No value is
* ever written into the SQL.
*/
const toApplyStatement = ({ sql, params }) => {
	const values = [];
	return {
		sql: sql.replace(/\$(\d+)/gu, (_, position) => {
			const value = params[Number(position) - 1];
			if (value === null || value === void 0) return "NULL";
			values.push(value);
			const read = `($1->>${values.length - 1})`;
			if (typeof value === "boolean") return `${read}::boolean`;
			if (typeof value === "number") return `${read}::${Number.isInteger(value) ? "bigint" : "double precision"}`;
			return read;
		}),
		params: values
	};
};
/** PostgREST's code for a missing function or table reads as a missing table. */
const withCode = (error) => Object.assign(new Error(error.message, { cause: error }), { code: error.code === "PGRST202" || error.code === "PGRST205" ? "42P01" : error.code });
/**
* The SQL core's executor over Supabase: every statement goes through the
* apply RPC, and a write is one RPC call, so one transaction.
*/
const supabaseExecutor = (client) => {
	const apply = async (statements) => {
		const { data, error } = await client.rpc(SUPABASE_APPLY_FUNCTION, { p_statements: statements.map(toApplyStatement) });
		if (error) throw withCode(error);
		return data;
	};
	return {
		dialect: "postgresql",
		execute: async (statement) => (await apply([statement]))[0],
		batch: apply,
		transaction: () => {
			throw new Error("Supabase writes are batches through the apply RPC.");
		}
	};
};
//#endregion
//#region src/supabaseDatabase.ts
/**
* Hot Updater's database on Supabase: the storage engine through the shared
* SQL core, fenced by the schema settings. Every read and write goes through
* the service-role-only apply RPC, which runs no DDL, so Supabase migrations
* create the tables.
*/
const supabaseDatabase = (config) => {
	const { migrations: _migrations, ...adapter } = (0, _hot_updater_plugin_core.createSqlAdapter)({
		executor: supabaseExecutor((0, _supabase_supabase_js.createClient)(config.supabaseUrl, resolveSupabaseServiceRoleKey(config))),
		tablePrefix: SUPABASE_TABLE_PREFIX
	});
	return (0, _hot_updater_plugin_core.createEngineDatabase)({
		name: "supabaseDatabase",
		adapter
	});
};
//#endregion
//#region src/supabaseSignedUrlBatcher.ts
function getErrorMessage(error) {
	if (error instanceof Error) return error.message;
	if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
	return String(error);
}
const createSupabaseSignedUrlBatcher = ({ createSignedUrls, expiresIn, formatObjectPath }) => {
	let pendingByBucket = /* @__PURE__ */ new Map();
	let flushScheduled = false;
	const createSignedUrlError = (bucketName, key, error) => /* @__PURE__ */ new Error(`Failed to generate download URL for "${formatObjectPath(bucketName, key)}": ${getErrorMessage(error)}`);
	const flush = async () => {
		const batches = pendingByBucket;
		pendingByBucket = /* @__PURE__ */ new Map();
		flushScheduled = false;
		await Promise.all([...batches.entries()].map(async ([bucketName, pending]) => {
			try {
				const { data, error } = await createSignedUrls(bucketName, pending.map(({ key }) => key), expiresIn);
				if (error || !data) {
					const batchError = error ?? /* @__PURE__ */ new Error("missing signed URL response");
					for (const request of pending) request.reject(createSignedUrlError(bucketName, request.key, batchError));
					return;
				}
				pending.forEach((request, index) => {
					const result = data[index];
					if (!result?.error && result?.signedUrl) {
						request.resolve(result.signedUrl);
						return;
					}
					request.reject(createSignedUrlError(bucketName, request.key, result?.error ?? /* @__PURE__ */ new Error("missing signed URL")));
				});
			} catch (error) {
				for (const request of pending) request.reject(createSignedUrlError(bucketName, request.key, error));
			}
		}));
	};
	return (bucketName, key) => new Promise((resolve, reject) => {
		const pending = pendingByBucket.get(bucketName) ?? [];
		pending.push({
			key,
			reject,
			resolve
		});
		pendingByBucket.set(bucketName, pending);
		if (!flushScheduled) {
			flushScheduled = true;
			queueMicrotask(() => {
				flush();
			});
		}
	});
};
//#endregion
//#region src/supabaseStorage.ts
const isNotFoundError = (error) => error?.message?.toLowerCase().includes("not found") === true;
/**
* Storage's unread response to a download or HEAD request it failed, which
* supabase-js wraps in a StorageUnknownError.
*/
const failedResponseOf = (error) => {
	if (typeof error !== "object" || error === null || Reflect.get(error, "name") !== "StorageUnknownError") return;
	const response = Reflect.get(error, "originalError");
	if (typeof response !== "object" || response === null || typeof Reflect.get(response, "status") !== "number") return;
	return response;
};
/** Storage answers a HEAD request for a missing object with 400 or 404. */
const isMissingExistsError = (error) => {
	const status = failedResponseOf(error)?.status;
	return status === 400 || status === 404;
};
/**
* Storage answers a download of a missing object with 400 or 404 and
* `error: "not_found"`, and a missing bucket with another error.
*/
const isMissingObjectError = async (error) => {
	const response = failedResponseOf(error);
	if (response?.status !== 400 && response?.status !== 404) return false;
	const body = await response.json().catch(() => void 0);
	return typeof body === "object" && body !== null && Reflect.get(body, "error") === "not_found";
};
/** A character Storage rejects in an object name, `?`, or `!`. */
const ESCAPED_CHARACTER = /[^A-Za-z0-9_/.*'() &$=@;:+,-]/gu;
const utf8 = new TextEncoder();
/**
* The object name Storage keeps a key under. Storage accepts names of ASCII
* letters, digits and `_/!.*'() &$=@;:+,?-` only, and supabase-js puts a name
* in the request URL unencoded, where `?` ends the path. So every other
* character of the key, `?`, and the escape character `!` are stored as `!`
* and the two hex digits of each of their UTF-8 bytes, such as `#` as `!23`.
* Distinct keys keep distinct names, and the names need no URL encoding.
* Deploy's keys, such as `<bundleId>/manifest.json`, are stored as they are.
*/
const toObjectName = (key) => key.replace(ESCAPED_CHARACTER, (character) => Array.from(utf8.encode(character), (byte) => `!${byte.toString(16).toUpperCase().padStart(2, "0")}`).join(""));
const supabaseStorage = (config) => {
	const bucket = (0, _supabase_supabase_js.createClient)(config.supabaseUrl, resolveSupabaseServiceRoleKey(config)).storage.from(config.bucketName);
	const getStorageKey = (0, _hot_updater_plugin_core.createStorageKeyBuilder)(config.basePath);
	const resolveSignedUrl = createSupabaseSignedUrlBatcher({
		createSignedUrls: (_bucketName, keys, expiresIn) => bucket.createSignedUrls(keys, expiresIn),
		expiresIn: config.signedUrlExpiresIn ?? 3600,
		formatObjectPath: (_bucketName, key) => key
	});
	const parseAndValidate = (storageUri) => {
		const parsed = (0, _hot_updater_plugin_core.parseStorageUri)(storageUri, "supabase-storage");
		if (parsed.bucket !== config.bucketName) throw new Error(`Bucket name mismatch: expected "${config.bucketName}", but found "${parsed.bucket}".`);
		return parsed;
	};
	return (0, _hot_updater_plugin_core.createStorageAdapter)({
		name: "supabaseStorage",
		protocol: "supabase-storage",
		async put({ key, body, contentLength, contentType }) {
			const storageKey = getStorageKey(key);
			const { error } = await bucket.upload(toObjectName(storageKey), body, {
				contentType,
				cacheControl: "max-age=31536000",
				upsert: true,
				duplex: "half",
				...contentLength === void 0 ? {} : { headers: { "content-length": String(contentLength) } }
			});
			if (error) throw error;
			return { storageUri: (0, _hot_updater_plugin_core.createStorageUri)({
				protocol: "supabase-storage",
				bucket: config.bucketName,
				key: storageKey
			}) };
		},
		async get({ storageUri }) {
			const { key } = parseAndValidate(storageUri);
			const { data, error } = await bucket.download(toObjectName(key));
			if (error) {
				if (await isMissingObjectError(error)) return { response: null };
				throw new Error(`Failed to download storage object: ${error.message}`);
			}
			return { response: data ? new Response(data) : null };
		},
		async getDownloadUrl({ storageUri }) {
			const { key } = parseAndValidate(storageUri);
			return { url: await resolveSignedUrl(config.bucketName, toObjectName(key)) };
		},
		async exists({ storageUri }) {
			const { key } = parseAndValidate(storageUri);
			const { data, error } = await bucket.exists(toObjectName(key));
			if (error) {
				if (isMissingExistsError(error)) return { exists: false };
				throw error;
			}
			return { exists: data };
		},
		async delete({ storageUri }) {
			const { key } = parseAndValidate(storageUri);
			const { error } = await bucket.remove([toObjectName(key)]);
			if (error && !isNotFoundError(error)) throw new Error(`Failed to delete storage object: ${error.message}`);
			return { deleted: true };
		}
	});
};
//#endregion
Object.defineProperty(exports, "SUPABASE_APPLY_FUNCTION", {
	enumerable: true,
	get: function() {
		return SUPABASE_APPLY_FUNCTION;
	}
});
Object.defineProperty(exports, "SUPABASE_TABLE_PREFIX", {
	enumerable: true,
	get: function() {
		return SUPABASE_TABLE_PREFIX;
	}
});
Object.defineProperty(exports, "supabaseDatabase", {
	enumerable: true,
	get: function() {
		return supabaseDatabase;
	}
});
Object.defineProperty(exports, "supabaseStorage", {
	enumerable: true,
	get: function() {
		return supabaseStorage;
	}
});
