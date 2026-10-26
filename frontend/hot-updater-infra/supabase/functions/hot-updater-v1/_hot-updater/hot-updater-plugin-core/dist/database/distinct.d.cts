//#region src/database/distinct.d.ts
/**
 * The sketch with `identity` added; a missing sketch is the empty one. A
 * plugin passes it as a `distinct` column's change to `tx.aggregate`.
 */
declare const addDistinct: (summary: string | null | undefined, identity: string) => string;
/**
 * The union of sketches, register by register: how a plugin combines a
 * `distinct` column across the aggregate rows it reads.
 */
declare const mergeDistinct: (summaries: readonly (string | null | undefined)[]) => string;
/**
 * The estimated number of distinct values a sketch holds: how a plugin
 * reads a `distinct` column.
 */
declare const countDistinct: (summary: string | null | undefined) => number;
//#endregion
export { addDistinct, countDistinct, mergeDistinct };