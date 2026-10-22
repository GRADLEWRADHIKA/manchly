//#region src/node.ts
/**
* Converts a Hot Updater handler to a Node.js-compatible middleware
* Works with Express, Connect, and other frameworks using Node.js req/res
*
* @example
* ```typescript
* import { toNodeHandler } from "@hot-updater/server";
* import express from "express";
*
* const app = express();
*
* app.use(
*   "/hot-updater/admin",
*   bearerMiddleware,
*   express.json({ limit: "1mb" }),
*   toNodeHandler(hotUpdater.handlers.admin),
* );
* app.use(
*   "/hot-updater",
*   express.json({ limit: "1mb" }),
*   toNodeHandler(hotUpdater.handlers.client),
* );
* ```
*/
function toNodeHandler(handler) {
	return async (req, res) => {
		try {
			const url = `${req.protocol || "http"}://${req.get?.("host") || "localhost"}${req.url ?? "/"}`;
			const headers = new Headers();
			for (const [key, value] of Object.entries(req.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(", ") : value);
			let body;
			if (req.method && req.method !== "GET" && req.method !== "HEAD" && req.body) body = JSON.stringify(req.body);
			const response = await handler(new globalThis.Request(url, {
				method: req.method || "GET",
				headers,
				body
			}));
			res.status(response.status);
			response.headers.forEach((value, key) => {
				res.setHeader(key, value);
			});
			const responseBody = Buffer.from(await response.arrayBuffer());
			if (responseBody.length > 0) res.send(responseBody);
			else res.end();
		} catch (error) {
			console.error("Hot Updater handler error:", error);
			res.status(500);
			res.send("Internal Server Error");
		}
	};
}
//#endregion
export { toNodeHandler };
