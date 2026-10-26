//#region src/releaseManagement.ts
var ReleaseManagementError = class extends Error {
	code;
	name = "ReleaseManagementError";
	constructor(code, message) {
		super(message);
		this.code = code;
	}
};
//#endregion
export { ReleaseManagementError };
