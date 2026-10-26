import { isUUIDv7 as isUUIDv7$1 } from "@hot-updater/protocol";
//#region src/uuidv7.d.ts
declare const extractTimestampFromUUIDv7: (uuid: string) => number;
declare const createUUIDv7: () => string;
declare const createUUIDv7After: (floor: string | null, nowMs?: number) => string;
declare const createUUIDv7WithSameTimestamp: (originalUuid: string) => string;
//#endregion
export { createUUIDv7, createUUIDv7After, createUUIDv7WithSameTimestamp, extractTimestampFromUUIDv7, isUUIDv7$1 as isUUIDv7 };