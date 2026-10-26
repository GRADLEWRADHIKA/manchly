//#region src/releaseCatalogMutation.ts
var ReleaseCatalogMutationError = class extends Error {
	code;
	name = "ReleaseCatalogMutationError";
	constructor(code, message) {
		super(message);
		this.code = code;
	}
};
//#endregion
export { ReleaseCatalogMutationError };
