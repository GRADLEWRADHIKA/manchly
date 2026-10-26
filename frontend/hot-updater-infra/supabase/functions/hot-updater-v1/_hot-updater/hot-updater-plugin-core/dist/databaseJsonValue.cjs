//#region src/databaseJsonValue.ts
const isDatabaseJsonValue = (value) => {
	const ancestors = /* @__PURE__ */ new WeakSet();
	const validate = (input) => {
		if (input === null || typeof input === "string" || typeof input === "boolean") return true;
		if (typeof input === "number") return Number.isFinite(input);
		if (typeof input !== "object") return false;
		if (ancestors.has(input)) return false;
		ancestors.add(input);
		try {
			if (Array.isArray(input)) {
				if (Object.getPrototypeOf(input) !== Array.prototype) return false;
				if (Reflect.ownKeys(input).length !== input.length + 1) return false;
				for (let index = 0; index < input.length; index += 1) {
					const descriptor = Object.getOwnPropertyDescriptor(input, String(index));
					if (descriptor === void 0 || !descriptor.enumerable || !("value" in descriptor) || !validate(descriptor.value)) return false;
				}
				return true;
			}
			const prototype = Object.getPrototypeOf(input);
			if (prototype !== Object.prototype && prototype !== null) return false;
			for (const key of Reflect.ownKeys(input)) {
				if (typeof key !== "string" || key === "__proto__") return false;
				const descriptor = Object.getOwnPropertyDescriptor(input, key);
				if (descriptor === void 0 || !descriptor.enumerable || !("value" in descriptor) || !validate(descriptor.value)) return false;
			}
			return true;
		} finally {
			ancestors.delete(input);
		}
	};
	return validate(value);
};
/**
* Whether `value` is a plain object of JSON values a store keeps as they
* are: no cycles, accessors, non-finite numbers, or class instances. A
* plugin checks a `json` field's value with it before it writes, as
* Insights does for an event's metadata.
*/
const isDatabaseJsonObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value) && isDatabaseJsonValue(value);
const isDatabaseMetadataObject = (value) => isDatabaseJsonObject(value) && (!Object.hasOwn(value, "app_version") || typeof value["app_version"] === "string");
//#endregion
exports.isDatabaseJsonObject = isDatabaseJsonObject;
exports.isDatabaseJsonValue = isDatabaseJsonValue;
exports.isDatabaseMetadataObject = isDatabaseMetadataObject;
