//#region src/handlerErrors.ts
var HandlerBadRequestError = class extends Error {
	name = "HandlerBadRequestError";
	constructor(message) {
		super(message);
	}
};
//#endregion
export { HandlerBadRequestError };
