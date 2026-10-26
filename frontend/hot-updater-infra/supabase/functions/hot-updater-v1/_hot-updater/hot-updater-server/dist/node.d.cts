import { HotUpdaterHandler } from "./handlerTypes.cjs";
//#region src/node.d.ts
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
declare function toNodeHandler(handler: HotUpdaterHandler): (req: any, res: any, next?: any) => Promise<void>;
//#endregion
export { toNodeHandler };