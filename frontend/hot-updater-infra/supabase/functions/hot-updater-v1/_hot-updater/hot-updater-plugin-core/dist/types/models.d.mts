import { ChannelRow } from "./databaseRows.mjs";
//#region src/types/models.d.ts
interface ChannelInsertResult {
  readonly row: ChannelRow;
  readonly inserted: boolean;
}
type ChannelDeleteResult = {
  readonly deleted: true;
} | {
  readonly deleted: false;
  readonly reason: "not_found" | "not_empty";
};
//#endregion
export { ChannelDeleteResult, ChannelInsertResult };