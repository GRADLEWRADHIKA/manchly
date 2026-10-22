import { PrismaProvider } from "../db/enginePrismaSchema.mjs";
import { ToolingDatabase } from "@hot-updater/plugin-core";
//#region src/adapters/prisma.d.ts
interface PrismaConfig {
  /** A Prisma client: raw queries and interactive transactions run on it. */
  readonly prisma: object;
  readonly provider: PrismaProvider;
}
/**
 * Hot Updater's database on a Prisma client: the storage engine through the
 * shared SQL core, fenced by the schema settings. `db generate` writes the
 * models Prisma applies; `db migrate` then sets the collations Prisma cannot
 * declare and writes the settings rows the fence checks.
 */
declare const prismaAdapter: (config: PrismaConfig) => ToolingDatabase;
//#endregion
export { PrismaConfig, type PrismaProvider, prismaAdapter };