import { RemoteConfigApi } from "./api.cjs";
import { RemoteDatabase } from "@hot-updater/plugin-core";
//#region src/server/admin.d.ts
/** What tooling edits templates with: `RemoteConfigApi` without the devices' `resolve`. */
type RemoteConfigAdminApi = Omit<RemoteConfigApi, "resolve">;
interface RemoteConfigAdminApiOptions {
  /**
   * The error for a server that runs without `remoteConfig()`, whose admin
   * API answers its routes with core's 404.
   */
  readonly unavailable?: () => Error;
}
/**
 * Remote Config over a self-hosted server's admin routes, for tooling that
 * reaches it through `standaloneRepository`. It answers as the API does: an
 * invalid template throws `RemoteConfigValidationError` with the server's
 * issues.
 */
declare const createRemoteConfigAdminApi: (fetchAdmin: RemoteDatabase["fetchAdmin"], { unavailable }?: RemoteConfigAdminApiOptions) => RemoteConfigAdminApi;
//#endregion
export { RemoteConfigAdminApi, RemoteConfigAdminApiOptions, createRemoteConfigAdminApi };