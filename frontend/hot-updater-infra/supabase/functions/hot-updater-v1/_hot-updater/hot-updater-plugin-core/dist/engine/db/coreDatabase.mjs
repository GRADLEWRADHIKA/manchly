import { HOT_UPDATER_SCHEMA_VERSION, coreModule } from "../core/schema.mjs";
import { aggregateBatchingModule } from "../database/aggregateBatching.mjs";
import { resolveSchema } from "../database/resolveSchema.mjs";
import { ENGINE_SCHEMA_KEY, isMissingSchemaError, readSettings, withSchemaFence } from "../database/fence.mjs";
import { migrateSchema } from "./schemaSettings.mjs";
import { createEngineMigrator } from "./engineMigrator.mjs";
//#region src/engine/db/coreDatabase.ts
/** Core's tables: the tables every provider's tooling creates. */
const coreSchema = resolveSchema([coreModule]);
/** The settings rows a provider's database is fenced by. */
const coreSettings = {
	[ENGINE_SCHEMA_KEY]: "1",
	"schema.core": HOT_UPDATER_SCHEMA_VERSION
};
/** What `hot-updater db` creates for a server without plugins. */
const coreTarget = {
	schema: coreSchema,
	settings: coreSettings
};
/**
* The log and lease tables a database with `aggregateBatching` writes
* beside core's and the plugins', which a provider's access policy names,
* such as the managed AWS server's IAM role.
*/
const aggregateBatchingTables = resolveSchema([aggregateBatchingModule]).tables;
/** Each plugin's `schema.<id>` settings row. */
const pluginSettings = (plugins) => Object.fromEntries(plugins.map(({ id, schemaVersion }) => [`schema.${id}`, schemaVersion]));
/** A plugin's schema as the engine resolves it: prefixed by its id unless it keeps its names. */
const pluginModule = ({ id, schema, namespace }) => ({
	id,
	schema,
	...namespace === false ? {} : { namespace: id }
});
/**
* What `hot-updater db` creates for a server's plugins: core's tables, then
* each plugin's tables with its `schema.<id>` settings row.
*/
const toolingTargetOf = (plugins) => plugins.length === 0 ? coreTarget : {
	schema: resolveSchema([coreModule, ...plugins.map(pluginModule)]),
	settings: {
		...coreSettings,
		...pluginSettings(plugins)
	}
};
/**
* Creates core's tables and those of `plugins`, then writes their settings
* rows: what a provider's setup runs for the plugins its server runs.
*/
const migrateCoreSchema = (adapter, name, plugins = []) => {
	const { schema, settings } = toolingTargetOf(plugins);
	return migrateSchema(adapter, name, schema.tables, settings);
};
/**
* A provider's database on the storage engine: its adapter behind the schema
* fence, which checks core's settings rows before the first read or write
* and names `hot-updater db migrate` when they are missing or stale. When the
* adapter creates its own tables, `hot-updater db migrate` creates core's
* tables and the server's plugin tables, then writes their settings rows.
*/
const createEngineDatabase = ({ name, adapter, onCachedRoutesChange, aggregateBatching, retry, readSettings: readStored }) => {
	const fenced = withSchemaFence(adapter, name, coreSettings);
	const createMigrator = ({ schema, settings } = coreTarget) => createEngineMigrator({
		adapterName: name,
		adapter,
		schema,
		settings,
		readSettings: readStored ?? (async () => {
			const rows = await readSettings(adapter, Object.keys(settings)).catch((error) => {
				if (isMissingSchemaError(error)) return [];
				throw error;
			});
			return new Map(rows.flatMap((row) => row === null ? [] : [[String(row.key), row.value]]));
		})
	});
	return {
		name,
		adapter: fenced,
		...onCachedRoutesChange === void 0 ? {} : { onCachedRoutesChange },
		...aggregateBatching ? { aggregateBatching } : {},
		...retry === void 0 ? {} : { retry },
		...adapter.dispose === void 0 ? {} : { dispose: () => adapter.dispose() },
		...adapter.migrations === void 0 ? {} : { createMigrator }
	};
};
//#endregion
export { aggregateBatchingTables, coreSchema, coreSettings, coreTarget, createEngineDatabase, migrateCoreSchema, pluginModule, pluginSettings, toolingTargetOf };
