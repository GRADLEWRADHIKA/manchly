import { PhysicalTable, StoredRow } from "./adapter.mjs";
//#region src/database/values.d.ts
/**
 * Compares strings in UTF-8 byte order, which is Unicode code point order:
 * the order the engine sorts string keys in. A plugin that merges rows from
 * several reads, as Insights does, keeps that order with it.
 */
declare const compareUtf8: (left: string, right: string) => number;
/** `normalizeStoredRow`'s options. */
interface NormalizeOptions {
  /** The backend returns JSON and multi-valued columns as text. */
  readonly jsonText: boolean;
}
/** Converts every column of a backend row; unknown backend columns are dropped. */
declare const normalizeStoredRow: (table: PhysicalTable, raw: Readonly<Record<string, unknown>>, options: NormalizeOptions) => StoredRow;
//#endregion
export { NormalizeOptions, compareUtf8, normalizeStoredRow };