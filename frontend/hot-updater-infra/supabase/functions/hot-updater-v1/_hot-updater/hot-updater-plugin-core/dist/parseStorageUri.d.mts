//#region src/parseStorageUri.d.ts
interface ParsedStorageUri {
  readonly protocol: string;
  readonly bucket: string;
  readonly key: string;
}
interface CreateStorageUriInput {
  readonly protocol: string;
  readonly bucket: string;
  readonly key: string;
}
/**
 * Creates a hierarchical storage identifier in the form
 * `protocol://bucket/slash-separated-encoded-key`.
 */
declare const createStorageUri: ({ protocol, bucket, key }: CreateStorageUriInput) => string;
/**
 * Parses a hierarchical storage identifier and decodes each key segment.
 *
 * Search parameters and fragments are not part of a storage identifier.
 */
declare function parseStorageUri(storageUri: string, expectedProtocol: string): ParsedStorageUri;
//#endregion
export { CreateStorageUriInput, ParsedStorageUri, createStorageUri, parseStorageUri };