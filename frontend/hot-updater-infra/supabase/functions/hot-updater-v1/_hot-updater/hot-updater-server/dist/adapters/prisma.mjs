import { checkSqlProvider } from "./sqlProviders.mjs";
import { generatePrismaEngineSchema, prismaCollationStatements } from "../db/enginePrismaSchema.mjs";
import { prismaExecutor } from "./prismaExecutor.mjs";
import { coreSettings, coreTarget, createEngineDatabase, createSettingsMigrator, createSqlAdapter } from "@hot-updater/plugin-core";
//#region src/adapters/prisma.ts
/**
* Hot Updater's database on a Prisma client: the storage engine through the
* shared SQL core, fenced by the schema settings. `db generate` writes the
* models Prisma applies; `db migrate` then sets the collations Prisma cannot
* declare and writes the settings rows the fence checks.
*/
const prismaAdapter = (config) => {
	const provider = checkSqlProvider("prismaAdapter", config.provider);
	const executor = prismaExecutor(config.prisma, provider);
	return {
		...createEngineDatabase({
			name: "prisma",
			adapter: createSqlAdapter({ executor })
		}),
		provider,
		generateSchema: ((version, _name, { schema } = coreTarget) => {
			if (version !== "latest" && version !== coreSettings["schema.core"]) throw new Error(`Invalid version ${version}`);
			return {
				code: generatePrismaEngineSchema(provider, schema),
				path: "prisma/schema.prisma"
			};
		}),
		createMigrator: ({ schema, settings } = coreTarget) => {
			const collations = prismaCollationStatements(provider, schema);
			return createSettingsMigrator({
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
export { prismaAdapter };
