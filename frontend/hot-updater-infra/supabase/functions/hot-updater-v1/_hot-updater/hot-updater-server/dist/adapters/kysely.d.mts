import { kyselyExecutor } from "./kyselyExecutor.mjs";
import { SqlDialect, ToolingDatabase } from "@hot-updater/plugin-core";
import { Kysely } from "kysely";
//#region src/adapters/kysely.d.ts
interface KyselyAdapterConfig<TDatabase extends object = object> {
  readonly db: Kysely<TDatabase>;
  readonly provider: SqlDialect;
}
/**
 * Hot Updater's database on a Kysely instance: the storage engine through the
 * shared SQL core, fenced by the schema settings. `db migrate` and
 * `db generate --sql` apply the engine's SQL schema.
 */
declare const kyselyAdapter: <TDatabase extends object>(config: KyselyAdapterConfig<TDatabase>) => ToolingDatabase;
//#endregion
export { KyselyAdapterConfig, kyselyAdapter, kyselyExecutor };