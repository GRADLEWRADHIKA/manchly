import { HandlerBadRequestError } from "./handlerErrors.mjs";
//#region src/handlerParameters.ts
const decodeMaybe = (value) => {
	if (value === void 0) return void 0;
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
};
const isPlatform = (value) => value === "ios" || value === "android";
const requireRouteParam = (params, key) => {
	const value = params[key];
	if (!value) throw new HandlerBadRequestError(`Missing route parameter: ${key}`);
	return value;
};
const requirePlatformParam = (params) => {
	const platform = requireRouteParam(params, "platform");
	if (!isPlatform(platform)) throw new HandlerBadRequestError(`Invalid platform: ${platform}. Expected 'ios' or 'android'.`);
	return platform;
};
const parseBooleanSearchParam = (url, key) => {
	const value = url.searchParams.get(key);
	if (value === null) return void 0;
	if (value === "true") return true;
	if (value === "false") return false;
	throw new HandlerBadRequestError(`The '${key}' query parameter must be 'true' or 'false'.`);
};
//#endregion
export { decodeMaybe, isPlatform, parseBooleanSearchParam, requirePlatformParam, requireRouteParam };
