import { kyselyExecutor } from "./kyselyExecutor.mjs";
import { checkSqlProvider } from "./sqlProviders.mjs";
import { coreTarget, createEngineDatabase, createEngineSqlMigrator, createSqlAdapter } from "@hot-updater/plugin-core";
//#region src/adapters/kysely.ts
/**
* Hot Updater's database on a Kysely instance: the storage engine through the
* shared SQL core, fenced by the schema settings. `db migrate` and
* `db generate --sql` apply the engine's SQL schema.
*/
const kyselyAdapter = (config) => {
	const provider = checkSqlProvider("kyselyAdapter", config.provider);
	const executor = kyselyExecutor(config.db, provider);
	return {
		...createEngineDatabase({
			name: "kysely",
			adapter: createSqlAdapter({ executor })
		}),
		provider,
		createMigrator: ({ schema, settings } = coreTarget) => createEngineSqlMigrator({
			adapterName: "kysely",
			executor,
			schema,
			settings
		})
	};
};
//#endregion
export { kyselyAdapter, kyselyExecutor };
