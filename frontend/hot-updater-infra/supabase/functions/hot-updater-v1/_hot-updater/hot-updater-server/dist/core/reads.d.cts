import { CoreSchema, HotUpdaterDatabase } from "@hot-updater/plugin-core";
//#region src/core/reads.d.ts
type CoreDatabase = HotUpdaterDatabase<CoreSchema>;
interface CoreStorage {
  readonly readStorageText?: (storageUri: string) => Promise<string | null>;
  readonly resolveFileUrl: (storageUri: string | null) => Promise<string | null>;
}
//#endregion
export { CoreDatabase, CoreStorage };