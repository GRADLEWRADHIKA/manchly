Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_sqlProviders = require("./sqlProviders.cjs");
const require_enginePrismaSchema = require("../db/enginePrismaSchema.cjs");
const require_prismaExecutor = require("./prismaExecutor.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/adapters/prisma.ts
/**
* Hot Updater's database on a Prisma client: the storage engine through the
* shared SQL core, fenced by the schema settings. `db generate` writes the
* models Prisma applies; `db migrate` then sets the collations Prisma cannot
* declare and writes the settings rows the fence checks.
*/
const prismaAdapter = (config) => {
	const provider = require_sqlProviders.checkSqlProvider("prismaAdapter", config.provider);
	const executor = require_prismaExecutor.prismaExecutor(config.prisma, provider);
	return {
		...(0, _hot_updater_plugin_core.createEngineDatabase)({
			name: "prisma",
			adapter: (0, _hot_updater_plugin_core.createSqlAdapter)({ executor })
		}),
		provider,
		generateSchema: ((version, _name, { schema } = _hot_updater_plugin_core.coreTarget) => {
			if (version !== "latest" && version !== _hot_updater_plugin_core.coreSettings["schema.core"]) throw new Error(`Invalid version ${version}`);
			return {
				code: require_enginePrismaSchema.generatePrismaEngineSchema(provider, schema),
				path: "prisma/schema.prisma"
			};
		}),
		createMigrator: ({ schema, settings } = _hot_updater_plugin_core.coreTarget) => {
			const collations = require_enginePrismaSchema.prismaCollationStatements(provider, schema);
			return (0, _hot_updater_plugin_core.createSettingsMigrator)({
				adapterName: "prisma",
				executor,
				settings,
				applyTables: "`prisma db push` (or `prisma migrate`)",
				...collations.length === 0 ? {} : { fixups: {
					description: "Set the collations Prisma cannot declare, so strings compare by their bytes",
					statements: collations
				} }
			});
		}
	};
};
//#endregion
exports.prismaAdapter = prismaAdapter;
