import { ownEntry } from "../shared/ownEntry.mjs";
import { semverSatisfies } from "@hot-updater/plugin-core";
import { getNumericCohortRolloutPosition, getNumericCohortValue, isValidCohort, normalizeCohortValue } from "@hot-updater/protocol";
import { isValidRange } from "verkit";
//#region src/server/template.ts
const EMPTY_REMOTE_CONFIG_TEMPLATE = Object.freeze({
	conditions: Object.freeze([]),
	parameters: Object.freeze({})
});
/**
* A template's JSON stays under this many characters, so a device's values
* always fit the 64 KB a client plugin may store under one key.
*/
const REMOTE_CONFIG_MAX_TEMPLATE_LENGTH = 6e4;
const REMOTE_CONFIG_MAX_PARAMETERS = 2e3;
const REMOTE_CONFIG_MAX_CONDITIONS = 500;
const MAX_RULE_VALUES = 100;
const MAX_DESCRIPTION_LENGTH = 256;
const MAX_CONDITION_NAME_LENGTH = 100;
const MAX_RULE_TEXT_LENGTH = 128;
const PARAMETER_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]{0,255}$/u;
const SEED_PATTERN = /^[A-Za-z0-9_-]{1,64}$/u;
/** A date-time with its time zone, so it names one instant. */
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/u;
const VALUE_TYPES = /* @__PURE__ */ new Set([
	"STRING",
	"NUMBER",
	"BOOLEAN",
	"JSON"
]);
const PLATFORMS = /* @__PURE__ */ new Set(["ios", "android"]);
/** A template that cannot be published; `issues` lists every problem found. */
var RemoteConfigValidationError = class extends Error {
	issues;
	name = "RemoteConfigValidationError";
	constructor(issues) {
		super(`The Remote Config template is invalid: ${issues.slice(0, 3).map(({ path, message }) => path ? `${path}: ${message}` : message).join("; ")}${issues.length > 3 ? ` (and ${issues.length - 3} more)` : ""}`);
		this.issues = issues;
	}
};
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const visibleText = (value, max) => typeof value === "string" && value.trim().length > 0 && value.length <= max && !/[\p{Cc}]/u.test(value);
/** Whether a value's text suits its type; the problem otherwise. */
const checkValueText = (valueType, text) => {
	switch (valueType) {
		case "NUMBER": return text.trim().length > 0 && Number.isFinite(Number(text)) ? null : "must be a number.";
		case "BOOLEAN": return text === "true" || text === "false" ? null : "must be \"true\" or \"false\".";
		case "JSON": try {
			JSON.parse(text);
			return null;
		} catch {
			return "must be valid JSON.";
		}
		default: return null;
	}
};
/**
* Checks a template and returns it with only its declared fields, or throws
* `RemoteConfigValidationError` with every problem it finds.
*/
const validateRemoteConfigTemplate = (input) => {
	const issues = [];
	const issue = (path, message) => {
		issues.push({
			path,
			message
		});
	};
	const unknownKeys = (value, allowed, path) => {
		for (const key of Object.keys(value)) if (!allowed.includes(key)) issue(path ? `${path}.${key}` : key, "is not a template field.");
	};
	if (!isRecord(input)) throw new RemoteConfigValidationError([{
		path: "",
		message: "A template is an object."
	}]);
	unknownKeys(input, ["conditions", "parameters"], "");
	const conditions = [];
	const conditionNames = /* @__PURE__ */ new Set();
	const rawConditions = input.conditions ?? [];
	if (!Array.isArray(rawConditions)) issue("conditions", "must be a list.");
	else {
		if (rawConditions.length > 500) issue("conditions", `holds at most 500 conditions.`);
		rawConditions.forEach((raw, index) => {
			const path = `conditions[${index}]`;
			if (!isRecord(raw)) {
				issue(path, "must be an object.");
				return;
			}
			unknownKeys(raw, ["name", "rules"], path);
			const { name } = raw;
			if (!visibleText(name, MAX_CONDITION_NAME_LENGTH)) issue(`${path}.name`, `must be 1-${MAX_CONDITION_NAME_LENGTH} visible characters.`);
			else if (conditionNames.has(name)) issue(`${path}.name`, `"${name}" names another condition too.`);
			else conditionNames.add(name);
			const rules = validateRules(raw.rules, `${path}.rules`, issue);
			if (typeof name === "string") conditions.push({
				name,
				rules
			});
		});
	}
	const parameters = [];
	const rawParameters = input.parameters ?? {};
	if (!isRecord(rawParameters)) issue("parameters", "must be an object keyed by parameter.");
	else {
		const keys = Object.keys(rawParameters);
		if (keys.length > 2e3) issue("parameters", `holds at most ${REMOTE_CONFIG_MAX_PARAMETERS} parameters.`);
		for (const key of keys) {
			const path = `parameters.${key}`;
			if (!PARAMETER_KEY_PATTERN.test(key)) issue(path, "Parameter keys start with a letter or _, and hold up to 256 letters, digits, and _.");
			const raw = rawParameters[key];
			if (!isRecord(raw)) {
				issue(path, "must be an object.");
				continue;
			}
			unknownKeys(raw, [
				"valueType",
				"defaultValue",
				"conditionalValues",
				"description"
			], path);
			const valueType = raw.valueType;
			if (typeof valueType !== "string" || !VALUE_TYPES.has(valueType)) {
				issue(`${path}.valueType`, "must be STRING, NUMBER, BOOLEAN, or JSON.");
				continue;
			}
			const type = valueType;
			const readValue = (value, valuePath) => {
				if (!isRecord(value)) {
					issue(valuePath, "must be { value } or { useInAppDefault: true }.");
					return null;
				}
				if ("useInAppDefault" in value) {
					unknownKeys(value, ["useInAppDefault"], valuePath);
					if (value.useInAppDefault !== true) {
						issue(`${valuePath}.useInAppDefault`, "must be true.");
						return null;
					}
					return { useInAppDefault: true };
				}
				unknownKeys(value, ["value"], valuePath);
				if (typeof value.value !== "string") {
					issue(`${valuePath}.value`, "must be text.");
					return null;
				}
				const problem = checkValueText(type, value.value);
				if (problem !== null) {
					issue(`${valuePath}.value`, problem);
					return null;
				}
				return { value: value.value };
			};
			const defaultValue = readValue(raw.defaultValue, `${path}.defaultValue`);
			const conditionalValues = [];
			if (raw.conditionalValues !== void 0) {
				if (!isRecord(raw.conditionalValues)) issue(`${path}.conditionalValues`, "must be an object keyed by condition.");
				else for (const [conditionName, value] of Object.entries(raw.conditionalValues)) {
					const valuePath = `${path}.conditionalValues.${conditionName}`;
					if (!conditionNames.has(conditionName)) {
						issue(valuePath, `No condition is named "${conditionName}".`);
						continue;
					}
					const read = readValue(value, valuePath);
					if (read !== null) conditionalValues.push([conditionName, read]);
				}
			}
			let description;
			if (raw.description !== void 0) {
				const text = typeof raw.description === "string" ? raw.description.trim() : null;
				if (text === null || text.length > MAX_DESCRIPTION_LENGTH) issue(`${path}.description`, `must be text of up to ${MAX_DESCRIPTION_LENGTH} characters.`);
				else if (text.length > 0) description = text;
			}
			if (defaultValue !== null) parameters.push([key, {
				valueType: type,
				defaultValue,
				...conditionalValues.length === 0 ? {} : { conditionalValues: Object.fromEntries(conditionalValues) },
				...description === void 0 ? {} : { description }
			}]);
		}
	}
	if (issues.length > 0) throw new RemoteConfigValidationError(issues);
	const template = {
		conditions,
		parameters: Object.fromEntries(parameters)
	};
	const length = JSON.stringify(template).length;
	if (length > 6e4) throw new RemoteConfigValidationError([{
		path: "",
		message: `The template takes ${length.toLocaleString("en-US")} characters of JSON; the limit is ${REMOTE_CONFIG_MAX_TEMPLATE_LENGTH.toLocaleString("en-US")}.`
	}]);
	return template;
};
const textList = (value, path, issue, check, describe) => {
	if (!Array.isArray(value) || value.length === 0 || value.length > MAX_RULE_VALUES) {
		issue(path, `must list 1-${MAX_RULE_VALUES} values.`);
		return [];
	}
	const list = [];
	value.forEach((entry, index) => {
		if (typeof entry !== "string" || !check(entry)) issue(`${path}[${index}]`, describe);
		else if (!list.includes(entry)) list.push(entry);
	});
	return list;
};
const RULE_FIELDS = {
	platform: ["type", "platforms"],
	channel: ["type", "channels"],
	appVersion: ["type", "range"],
	cohort: ["type", "cohorts"],
	percent: [
		"type",
		"seed",
		"from",
		"to"
	],
	fingerprint: ["type", "hashes"],
	dateTime: [
		"type",
		"from",
		"to"
	]
};
const validateRules = (value, path, issue) => {
	if (!Array.isArray(value) || value.length === 0) {
		issue(path, "must list at least one rule.");
		return [];
	}
	const rules = [];
	value.forEach((raw, index) => {
		const rulePath = `${path}[${index}]`;
		if (!isRecord(raw) || typeof raw.type !== "string") {
			issue(rulePath, "must be a rule object with a type.");
			return;
		}
		const type = raw.type;
		const fields = ownEntry(RULE_FIELDS, type);
		if (fields === void 0) {
			issue(`${rulePath}.type`, "must be platform, channel, appVersion, cohort, percent, fingerprint, or dateTime.");
			return;
		}
		for (const key of Object.keys(raw)) if (!fields.includes(key)) issue(`${rulePath}.${key}`, `is not a field of a ${type} rule.`);
		switch (type) {
			case "platform": {
				const platforms = textList(raw.platforms, `${rulePath}.platforms`, issue, (text) => PLATFORMS.has(text), "must be \"ios\" or \"android\".");
				rules.push({
					type,
					platforms
				});
				return;
			}
			case "channel": {
				const channels = textList(raw.channels, `${rulePath}.channels`, issue, (text) => visibleText(text, MAX_RULE_TEXT_LENGTH), `must be a channel name of 1-${MAX_RULE_TEXT_LENGTH} characters.`);
				rules.push({
					type,
					channels
				});
				return;
			}
			case "appVersion": {
				const range = raw.range;
				if (!visibleText(range, MAX_RULE_TEXT_LENGTH) || !isValidRange(range.trim())) {
					issue(`${rulePath}.range`, "must be a semver range, such as >=1.4.0 or 2.x.");
					return;
				}
				rules.push({
					type,
					range: range.trim()
				});
				return;
			}
			case "cohort": {
				const cohorts = textList(raw.cohorts, `${rulePath}.cohorts`, issue, isValidCohort, "must be a cohort from 1 to 1000, or a lowercase slug.").map(normalizeCohortValue);
				rules.push({
					type,
					cohorts: [...new Set(cohorts)]
				});
				return;
			}
			case "percent": {
				const { seed, from, to } = raw;
				if (typeof seed !== "string" || !SEED_PATTERN.test(seed)) {
					issue(`${rulePath}.seed`, "must be 1-64 letters, digits, _, and -.");
					return;
				}
				const isPercent = (value) => typeof value === "number" && value >= 0 && value <= 100 && Math.abs(value * 10 - Math.round(value * 10)) < 1e-9;
				if (!isPercent(from) || !isPercent(to) || from >= to) {
					issue(rulePath, "takes from < to, each a percentage from 0 to 100 in steps of 0.1.");
					return;
				}
				rules.push({
					type,
					seed,
					from,
					to
				});
				return;
			}
			case "fingerprint": {
				const hashes = textList(raw.hashes, `${rulePath}.hashes`, issue, (text) => visibleText(text, MAX_RULE_TEXT_LENGTH), `must be a fingerprint of 1-${MAX_RULE_TEXT_LENGTH} characters.`);
				rules.push({
					type,
					hashes
				});
				return;
			}
			case "dateTime": {
				const instant = (field) => {
					const value = raw[field];
					if (value === void 0) return void 0;
					const ms = typeof value === "string" ? Date.parse(value) : NaN;
					if (typeof value !== "string" || !DATE_TIME_PATTERN.test(value) || !Number.isFinite(ms)) {
						issue(`${rulePath}.${field}`, "must be an ISO 8601 date-time with a time zone, such as 2026-10-08T10:00:00Z.");
						return null;
					}
					return new Date(ms).toISOString();
				};
				const from = instant("from");
				const to = instant("to");
				if (from === null || to === null) return;
				if (from === void 0 && to === void 0) {
					issue(rulePath, "takes from, to, or both.");
					return;
				}
				if (from !== void 0 && to !== void 0 && from >= to) {
					issue(rulePath, "takes a from before its to.");
					return;
				}
				rules.push({
					type,
					...from === void 0 ? {} : { from },
					...to === void 0 ? {} : { to }
				});
				return;
			}
		}
	});
	return rules;
};
/** Whether one rule matches a device. */
const matchesRemoteConfigRule = (rule, context) => {
	switch (rule.type) {
		case "platform": return context.platform !== void 0 && context.platform !== null && rule.platforms.includes(context.platform);
		case "channel": return typeof context.channel === "string" && rule.channels.includes(context.channel);
		case "appVersion": return typeof context.appVersion === "string" && semverSatisfies(rule.range, context.appVersion);
		case "cohort": return typeof context.cohort === "string" && rule.cohorts.includes(normalizeCohortValue(context.cohort));
		case "percent": {
			if (typeof context.cohort !== "string") return false;
			const cohort = getNumericCohortValue(context.cohort);
			if (cohort === null) return false;
			const position = getNumericCohortRolloutPosition(rule.seed, cohort);
			return position >= Math.round(rule.from * 10) && position < Math.round(rule.to * 10);
		}
		case "fingerprint": return typeof context.fingerprintHash === "string" && rule.hashes.includes(context.fingerprintHash);
		case "dateTime": return typeof context.now === "number" && (rule.from === void 0 || context.now >= Date.parse(rule.from)) && (rule.to === void 0 || context.now < Date.parse(rule.to));
	}
};
/** Whether every rule of a condition matches a device. */
const matchesRemoteConfigCondition = (condition, context) => condition.rules.every((rule) => matchesRemoteConfigRule(rule, context));
/**
* Every parameter's value for one device: the value of the first condition,
* in the template's order, that matches and that the parameter has a value
* for; otherwise its default value.
*/
const evaluateRemoteConfig = (template, context) => {
	const matched = template.conditions.filter((condition) => matchesRemoteConfigCondition(condition, context)).map(({ name }) => name);
	return Object.fromEntries(Object.entries(template.parameters).map(([key, parameter]) => {
		let condition = null;
		let chosen = parameter.defaultValue;
		for (const name of matched) {
			const value = ownEntry(parameter.conditionalValues, name);
			if (value !== void 0) {
				condition = name;
				chosen = value;
				break;
			}
		}
		return [key, {
			value: "value" in chosen ? chosen.value : null,
			condition
		}];
	}));
};
/** The values a device receives: each parameter's text, without in-app defaults. */
const resolveRemoteConfigValues = (template, context) => {
	return Object.fromEntries(Object.entries(evaluateRemoteConfig(template, context)).flatMap(([key, { value }]) => value === null ? [] : [[key, value]]));
};
//#endregion
export { EMPTY_REMOTE_CONFIG_TEMPLATE, REMOTE_CONFIG_MAX_CONDITIONS, REMOTE_CONFIG_MAX_PARAMETERS, REMOTE_CONFIG_MAX_TEMPLATE_LENGTH, RemoteConfigValidationError, evaluateRemoteConfig, matchesRemoteConfigCondition, matchesRemoteConfigRule, resolveRemoteConfigValues, validateRemoteConfigTemplate };
