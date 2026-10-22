import { PhysicalTable } from "../../database/adapter.mjs";
import { ModelShape, ReferenceAction } from "../../serverPlugin/definitions.mjs";
//#region src/engine/database/resolveSchema.d.ts
interface ResolvedReference {
  /** The child table and the field that holds the parent key. */
  readonly table: string;
  readonly field: string;
  readonly target: string;
  readonly onDelete: ReferenceAction;
  /** The counter column on the parent; absent for `none`. */
  readonly counter?: string;
}
/** A model of a `ResolvedSchema`, with its physical table. */
interface ResolvedModel {
  readonly module: string;
  /** The model name as its module declares it. */
  readonly model: string;
  readonly table: PhysicalTable;
  readonly definition: ModelShape;
  readonly references: readonly ResolvedReference[];
  readonly referencedBy: readonly ResolvedReference[];
  /** Index name to the physical name of its root table. */
  readonly roots: ReadonlyMap<string, string>;
}
/**
 * Modules resolved into physical tables with the engine's columns: a
 * `ToolingTarget`'s schema, which a schema generator renders.
 */
interface ResolvedSchema {
  /** By physical table name. */
  readonly models: ReadonlyMap<string, ResolvedModel>;
  readonly tables: readonly PhysicalTable[];
}
//#endregion
export { ResolvedModel, ResolvedReference, ResolvedSchema };