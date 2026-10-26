import { checkSqlProvider } from "./sqlProviders.mjs";
import { generateDrizzleEngineSchema } from "../db/engineDrizzleSchema.mjs";
import { DrizzleTransactionUnsupportedError, SUPPORTED_DRIZZLE_DRIVERS, drizzleExecutor } from "./drizzleExecutor.mjs";
import { coreSettings, coreTarget, createEngineDatabase, createSettingsMigrator, createSqlAdapter } from "@hot-updater/plugin-core";
//#region src/adapters/drizzle.ts
/**
* Hot Updater's database on a Drizzle instance: the storage engine through the
* shared SQL core, fenced by the schema settings. `db generate` writes the
* Drizzle schema drizzle-kit applies; `db migrate` then writes the settings
* rows the fence checks.
*/
const drizzleAdapter = (config) => {
	const provider = checkSqlProvider("drizzleAdapter", config.provider);
	const executor = drizzleExecutor(config.db, provider);
	return {
		...createEngineDatabase({
			name: "drizzle",
			adapter: createSqlAdapter({ executor })
		}),
		provider,
		generateSchema: ((version, _name, { schema } = coreTarget) => {
			if (version !== "latest" && version !== coreSettings["schema.core"]) throw new Error(`Invalid version ${version}`);
			return {
				code: generateDrizzleEngineSchema(provider, schema),
				path: "hot-updater-schema.ts"
			};
		}),
		createMigrator: ({ settings } = coreTarget) => createSettingsMigrator({
			adapterName: "drizzle",
			executor,
			settings,
			applyTables: "`drizzle-kit push` (or your drizzle-kit migrations)"
		})
	};
};
//#endregion
export { DrizzleTransactionUnsupportedError, SUPPORTED_DRIZZLE_DRIVERS, drizzleAdapter };
