//#region src/serverPlugin/busy.d.ts
/**
 * Whether the database is busy rather than broken, so the same request can
 * succeed later: a transaction ran out of retries, or the backend throttled
 * a request. Writes already retry transient failures, throttled ones
 * included, until the budget runs out. A throttled read throws the backend's
 * own error, so it is recognized by what the backends call it: a name the
 * AWS SDKs retry as throttling, HTTP 429, or gRPC's RESOURCE_EXHAUSTED.
 */
declare const isDatabaseBusyError: (error: unknown) => boolean;
//#endregion
export { isDatabaseBusyError };