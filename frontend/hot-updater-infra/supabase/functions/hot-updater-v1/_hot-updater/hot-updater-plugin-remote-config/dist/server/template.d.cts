import { RemoteConfigDeviceContext } from "../shared/wire.cjs";
//#region src/server/template.d.ts
/**
 * How the Console edits a parameter's value and checks it before a publish.
 * Devices receive every value as text.
 */
type RemoteConfigValueType = "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
/** A value a parameter takes: text, or the app's own default. */
type RemoteConfigParameterValue = {
  readonly value: string;
} | {
  readonly useInAppDefault: true;
};
interface RemoteConfigParameter {
  readonly valueType: RemoteConfigValueType;
  /** The value when none of the parameter's conditions match. */
  readonly defaultValue: RemoteConfigParameterValue;
  /**
   * Values by condition name. When several of these conditions match, the
   * one listed first in the template's `conditions` wins.
   */
  readonly conditionalValues?: Readonly<Record<string, RemoteConfigParameterValue>>;
  readonly description?: string;
}
/** A test on a device's context; a condition matches when all of its rules do. */
type RemoteConfigRule = {
  readonly type: "platform";
  readonly platforms: readonly ("ios" | "android")[];
} | {
  readonly type: "channel";
  readonly channels: readonly string[];
} |
/** A semver range, such as `>=1.4.0` or `2.x`, as release targets use. */
{
  readonly type: "appVersion";
  readonly range: string;
} |
/** Devices whose cohort is one of these: numbers from 1 to 1000 or slugs. */
{
  readonly type: "cohort";
  readonly cohorts: readonly string[];
} |
/**
 * A share of numeric cohorts: the devices whose cohort lands in
 * `[from, to)` percent once `seed` shuffles the 1,000 cohorts. Rules with
 * one seed pick from one order, so `0–10` and `10–20` never overlap; a new
 * seed picks other devices. Custom cohorts never match.
 */
{
  readonly type: "percent";
  readonly seed: string;
  readonly from: number;
  readonly to: number;
} | {
  readonly type: "fingerprint";
  readonly hashes: readonly string[];
} |
/**
 * While the server's clock is in `[from, to)`: ISO 8601 date-times in UTC,
 * either of them open. A device gets the change at its next fetch.
 */
{
  readonly type: "dateTime";
  readonly from?: string;
  readonly to?: string;
};
type RemoteConfigRuleType = RemoteConfigRule["type"];
interface RemoteConfigCondition {
  /** Unique in the template; parameters name it in `conditionalValues`. */
  readonly name: string;
  /** Every rule must match. */
  readonly rules: readonly RemoteConfigRule[];
}
/**
 * Everything Remote Config serves, published as a whole and versioned.
 */
interface RemoteConfigTemplate {
  /** In priority order: the first one that matches decides a parameter's value. */
  readonly conditions: readonly RemoteConfigCondition[];
  readonly parameters: Readonly<Record<string, RemoteConfigParameter>>;
}
declare const EMPTY_REMOTE_CONFIG_TEMPLATE: RemoteConfigTemplate;
/**
 * A template's JSON stays under this many characters, so a device's values
 * always fit the 64 KB a client plugin may store under one key.
 */
declare const REMOTE_CONFIG_MAX_TEMPLATE_LENGTH = 60000;
declare const REMOTE_CONFIG_MAX_PARAMETERS = 2000;
declare const REMOTE_CONFIG_MAX_CONDITIONS = 500;
/** One problem with a template, at a JSON path such as `parameters.welcome.defaultValue`. */
interface RemoteConfigTemplateIssue {
  readonly path: string;
  readonly message: string;
}
/** A template that cannot be published; `issues` lists every problem found. */
declare class RemoteConfigValidationError extends Error {
  readonly issues: readonly RemoteConfigTemplateIssue[];
  readonly name = "RemoteConfigValidationError";
  constructor(issues: readonly RemoteConfigTemplateIssue[]);
}
/**
 * Checks a template and returns it with only its declared fields, or throws
 * `RemoteConfigValidationError` with every problem it finds.
 */
declare const validateRemoteConfigTemplate: (input: unknown) => RemoteConfigTemplate;
/** What the server knows of a device; a rule on a missing field never matches. */
type RemoteConfigEvaluationContext = Partial<Readonly<{ [K in keyof RemoteConfigDeviceContext]: RemoteConfigDeviceContext[K] | null; }>> & {
  /**
   * When to evaluate, in ms since the epoch. The server uses its own clock;
   * a `dateTime` rule never matches without it.
   */
  readonly now?: number;
};
/** Whether one rule matches a device. */
declare const matchesRemoteConfigRule: (rule: RemoteConfigRule, context: RemoteConfigEvaluationContext) => boolean;
/** Whether every rule of a condition matches a device. */
declare const matchesRemoteConfigCondition: (condition: RemoteConfigCondition, context: RemoteConfigEvaluationContext) => boolean;
/** A parameter's value for one device, and the condition that chose it. */
interface RemoteConfigEvaluatedParameter {
  /** The text the device receives, or null when it keeps its in-app default. */
  readonly value: string | null;
  /** The condition whose value applies, or null for the default value. */
  readonly condition: string | null;
}
/**
 * Every parameter's value for one device: the value of the first condition,
 * in the template's order, that matches and that the parameter has a value
 * for; otherwise its default value.
 */
declare const evaluateRemoteConfig: (template: RemoteConfigTemplate, context: RemoteConfigEvaluationContext) => Record<string, RemoteConfigEvaluatedParameter>;
/** The values a device receives: each parameter's text, without in-app defaults. */
declare const resolveRemoteConfigValues: (template: RemoteConfigTemplate, context: RemoteConfigEvaluationContext) => Record<string, string>;
//#endregion
export { EMPTY_REMOTE_CONFIG_TEMPLATE, REMOTE_CONFIG_MAX_CONDITIONS, REMOTE_CONFIG_MAX_PARAMETERS, REMOTE_CONFIG_MAX_TEMPLATE_LENGTH, RemoteConfigCondition, RemoteConfigEvaluatedParameter, RemoteConfigEvaluationContext, RemoteConfigParameter, RemoteConfigParameterValue, RemoteConfigRule, RemoteConfigRuleType, RemoteConfigTemplate, RemoteConfigTemplateIssue, RemoteConfigValidationError, RemoteConfigValueType, evaluateRemoteConfig, matchesRemoteConfigCondition, matchesRemoteConfigRule, resolveRemoteConfigValues, validateRemoteConfigTemplate };