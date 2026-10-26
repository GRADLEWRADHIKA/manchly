import { RemoteConfigValidationError } from "./template.mjs";
//#region src/server/admin.ts
const readBody = async (response) => response.json().catch(() => null);
const field = (body, name) => typeof body === "object" && body !== null ? Reflect.get(body, name) : void 0;
/** A published version's record, as a publish or a rollback answers it. */
const isPublishedVersion = (body) => {
	const version = field(body, "version");
	const updateType = field(body, "updateType");
	return typeof version === "number" && Number.isSafeInteger(version) && version > 0 && (updateType === "PUBLISH" || updateType === "ROLLBACK") && typeof field(body, "createdAtMs") === "number";
};
const errorText = (body) => {
	const error = field(body, "error");
	return typeof error === "string" ? error : void 0;
};
/**
* Remote Config over a self-hosted server's admin routes, for tooling that
* reaches it through `standaloneRepository`. It answers as the API does: an
* invalid template throws `RemoteConfigValidationError` with the server's
* issues.
*/
const createRemoteConfigAdminApi = (fetchAdmin, { unavailable = () => /* @__PURE__ */ new Error("The server runs without remoteConfig(): its admin API serves no Remote Config routes.") } = {}) => {
	const request = async (path, init) => {
		const response = await fetchAdmin(path, init === void 0 ? void 0 : {
			method: init.method,
			headers: { "content-type": "application/json" },
			body: JSON.stringify(init.body)
		});
		const body = await readBody(response);
		if (response.status === 404 && errorText(body) === "Not found") throw unavailable();
		return {
			status: response.status,
			body
		};
	};
	const expectOk = (path, { status, body }) => {
		if (status >= 200 && status < 300) return body;
		throw new Error(errorText(body) ?? `The server answered ${path.split("?")[0]} with ${status}.`);
	};
	const published = (path, result) => {
		const currentVersion = field(result.body, "currentVersion");
		if (result.status === 409 && typeof currentVersion === "number" && Number.isSafeInteger(currentVersion)) return {
			status: "conflict",
			currentVersion
		};
		const issues = field(result.body, "issues");
		if (result.status === 400 && Array.isArray(issues)) throw new RemoteConfigValidationError(issues);
		const version = expectOk(path, result);
		if (!isPublishedVersion(version)) throw new Error(`The server answered ${path} without the version it published.`);
		return {
			status: "published",
			version
		};
	};
	return {
		getActive: async () => {
			const path = "/remote-config/template";
			return expectOk(path, await request(path));
		},
		listVersions: async ({ limit, cursor } = {}) => {
			const query = new URLSearchParams();
			if (limit !== void 0) query.set("limit", String(limit));
			if (cursor !== void 0) query.set("cursor", cursor);
			const path = `/remote-config/versions${query.size === 0 ? "" : `?${query}`}`;
			return expectOk(path, await request(path));
		},
		getVersion: async (version) => {
			const path = `/remote-config/versions/${version}`;
			const result = await request(path);
			return result.status === 404 ? null : expectOk(path, result);
		},
		publish: async ({ template, baseVersion, description }) => {
			const path = "/remote-config/template";
			return published(path, await request(path, {
				method: "PUT",
				body: {
					template,
					baseVersion,
					description
				}
			}));
		},
		rollback: async ({ version, baseVersion, description }) => {
			const path = `/remote-config/versions/${version}/rollback`;
			const result = await request(path, {
				method: "POST",
				body: {
					baseVersion,
					description
				}
			});
			return result.status === 404 ? { status: "not_found" } : published(path, result);
		}
	};
};
//#endregion
export { createRemoteConfigAdminApi };
