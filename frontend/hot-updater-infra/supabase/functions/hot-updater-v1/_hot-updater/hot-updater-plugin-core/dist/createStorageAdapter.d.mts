import { StorageAdapter } from "./types/index.mjs";
//#region src/createStorageAdapter.d.ts
type CreateStorageAdapterOptions = StorageAdapter;
type StorageOperation = Exclude<keyof StorageAdapter, "name" | "protocol">;
type StorageAdapterWith<TOperation extends StorageOperation> = StorageAdapter & Required<Pick<StorageAdapter, TOperation>>;
declare const createStorageAdapter: <const TOptions extends CreateStorageAdapterOptions>(options: TOptions) => TOptions;
declare function assertStorageOperations<const TOperations extends readonly StorageOperation[]>(adapter: StorageAdapter, operations: TOperations): asserts adapter is StorageAdapterWith<TOperations[number]>;
//#endregion
export { CreateStorageAdapterOptions, StorageAdapterWith, StorageOperation, assertStorageOperations, createStorageAdapter };