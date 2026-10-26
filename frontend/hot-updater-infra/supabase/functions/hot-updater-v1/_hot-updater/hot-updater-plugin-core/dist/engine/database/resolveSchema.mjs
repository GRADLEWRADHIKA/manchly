import { DatabaseSchemaError } from "../../database/adapter.mjs";
import { physicalRetention, retentionProblems } from "./retention.mjs";
//#region src/engine/database/resolveSchema.ts
const SHARD_COLUMN = "_shard";
const NAME = /^[a-z][a-z0-9_]*$/u;
const INDEX_NAME = /^[A-Za-z][A-Za-z0-9_]*$/u;
const tableName = (module, model) => module.namespace ? `${module.namespace}_${model}` : model;
const integer = (name, defaulted = false) => ({
	name,
	type: "integer",
	nullable: false,
	...defaulted ? { default: 0 } : {}
});
/** A declared or derived field's type, and whether it holds several values. */
const fieldType = (model, name) => {
	const field = model.fields[name] ?? (model.kind === "table" ? model.derived[name] : void 0);
	return field && {
		type: field.type,
		multi: "multi" in field && !!field.multi
	};
};
const metricsOf = (model) => [
	...model.counters,
	...model.gauges,
	...model.distinct
];
/** Field names, the key, and each field's options. */
const fieldProblems = (definition, add) => {
	const names = [...Object.keys(definition.fields), ...definition.kind === "table" ? Object.keys(definition.derived) : metricsOf(definition)];
	for (const name of new Set(names)) {
		if (!NAME.test(name)) add(`field "${name}" must match ${NAME.source}`);
		if (names.indexOf(name) !== names.lastIndexOf(name)) add(`field "${name}" is declared twice`);
	}
	const { key } = definition;
	if (key.length === 0) add("key is empty");
	if (new Set(key).size !== key.length) add("key repeats a field");
	for (const name of key) {
		const field = definition.fields[name];
		if (field === void 0) add(`key field "${name}" is not a declared field`);
		else if (field.required === false) add(`key field "${name}" is nullable`);
		else if (field.type === "json") add(`key field "${name}" is json`);
	}
	for (const [name, { type, maxLength, ascii }] of Object.entries(definition.fields)) {
		if (maxLength !== void 0 && (type !== "string" || !Number.isSafeInteger(maxLength) || maxLength < 1)) add(`field "${name}" has an invalid maxLength`);
		if (ascii && type !== "string") add(`field "${name}" is ascii but not a string`);
	}
};
/** A table's derived fields and references. */
const tableProblems = (definition, add, table) => {
	for (const [name, derived] of Object.entries(definition.derived)) {
		if (typeof derived.compute !== "function") add(`derived field "${name}" has no compute function`);
		if (derived.multi && derived.type === "json") add(`derived field "${name}" cannot be multi-valued json`);
	}
	for (const [name, { type, references }] of Object.entries(definition.fields)) {
		if (references === void 0) continue;
		const target = table(references.model);
		const targetKey = target?.key.length === 1 ? target.fields[target.key[0]] : void 0;
		if (targetKey === void 0) add(`field "${name}" references "${references.model}", which is not a single-key table of this module`);
		else if (targetKey.type !== type) add(`field "${name}" and the key of "${references.model}" differ in type`);
		if (references.onDelete === "cascade" && !Object.values(definition.indexes).some(({ eq }) => eq.length === 1 && eq[0] === name)) add(`cascade on "${name}" needs an index whose eq is exactly [${name}]`);
	}
};
/** An aggregate's identity, metrics, and shards. */
const aggregateProblems = (definition, add) => {
	const identity = Object.keys(definition.fields);
	if (definition.key.join("\0") !== identity.join("\0")) add(`key must list the identity fields in declaration order: ${identity.join(", ")}`);
	if (metricsOf(definition).length === 0) add("aggregate has no metrics");
	if (definition.distinct.length > 0 && definition.counters.length + definition.gauges.length > 0) add("distinct sketches need an aggregate of their own");
	const { shards } = definition;
	if (!Number.isSafeInteger(shards) || shards < 1 || shards > 64) add(`shards must be 1–64`);
};
/** Every problem in one model's declaration, its roots and references included. */
const problemsOf = (module, model, definition) => {
	const problems = [];
	const add = (message) => problems.push(`${module.id}.${model}: ${message}`);
	const table = (name) => {
		const target = module.schema[name];
		return target?.kind === "table" ? target : void 0;
	};
	if (!NAME.test(model)) add("model names use lowercase letters, digits, and _");
	fieldProblems(definition, add);
	for (const [name, index] of Object.entries(definition.indexes)) {
		const columns = [...index.eq, ...index.sort];
		if (!INDEX_NAME.test(name)) add(`index "${name}" must match ${INDEX_NAME.source}`);
		if (columns.length === 0) add(`index "${name}" has no fields`);
		if (index.unique && index.sort.length > 0) add(`unique index "${name}" cannot sort`);
		if (columns.filter((column) => {
			const type = fieldType(definition, column);
			if (type === void 0) add(`index "${name}" names undeclared field "${column}"`);
			else if (type.type === "json") add(`index "${name}" names json field "${column}"`);
			else if (type.multi && index.sort.includes(column)) add(`index "${name}" sorts by multi-valued field "${column}"`);
			return type?.type !== "json" && type?.multi;
		}).length > 1) add(`index "${name}" has more than one multi-valued field`);
		if (index.root === void 0) continue;
		const root = table(index.root.model);
		if (root === void 0) add(`index "${name}" is rooted at unknown table "${index.root.model}"`);
		else if (root.key.length > index.eq.length || root.key.some((field, position) => fieldType(definition, index.eq[position])?.type !== root.fields[field].type)) add(`index "${name}" eq must start with the key of "${index.root.model}"`);
	}
	if (definition.kind === "table") tableProblems(definition, add, table);
	else aggregateProblems(definition, add);
	for (const problem of retentionProblems(module.schema, model)) add(problem);
	return problems;
};
/** Rejects invalid module schemas at startup, listing every problem. */
const validateSchema = (modules) => {
	const problems = [];
	const owners = /* @__PURE__ */ new Map();
	for (const module of modules) for (const [model, definition] of Object.entries(module.schema)) {
		const name = tableName(module, model);
		const owner = owners.get(name);
		if (owner !== void 0) problems.push(`${module.id}.${model}: table "${name}" is also declared by ${owner}`);
		owners.set(name, `${module.id}.${model}`);
		problems.push(...problemsOf(module, model, definition));
	}
	if (problems.length > 0) throw new DatabaseSchemaError(`Invalid database schema:\n- ${problems.join("\n- ")}`);
};
const indexesOf = (definition) => [...Object.entries(definition.indexes).map(([name, index]) => ({
	name,
	eq: [...index.eq],
	sort: [...index.sort],
	...index.unique ? { unique: true } : {}
})), ...Object.entries(definition.fields).flatMap(([name, field]) => field.unique ? [{
	name,
	eq: [name],
	sort: [],
	unique: true
}] : [])];
/** Validates the modules, then resolves them into physical tables with engine columns. */
const resolveSchema = (modules) => {
	validateSchema(modules);
	const references = [];
	for (const module of modules) for (const [model, definition] of Object.entries(module.schema)) {
		if (definition.kind !== "table") continue;
		const table = tableName(module, model);
		for (const [field, { references: to }] of Object.entries(definition.fields)) {
			if (to === void 0) continue;
			const { onDelete } = to;
			const target = tableName(module, to.model);
			const counter = onDelete === "none" ? {} : { counter: `_refs_${table}_${field}` };
			references.push({
				table,
				field,
				target,
				onDelete,
				...counter
			});
		}
	}
	const models = /* @__PURE__ */ new Map();
	for (const module of modules) for (const [model, definition] of Object.entries(module.schema)) {
		const name = tableName(module, model);
		const referencedBy = references.filter(({ target }) => target === name);
		const columns = Object.entries(definition.fields).map(([field, { type, required, maxLength, ascii }]) => ({
			name: field,
			type,
			nullable: required === false,
			...maxLength === void 0 ? {} : { maxLength },
			...ascii ? { ascii } : {}
		}));
		if (definition.kind === "table") for (const [field, { type, multi }] of Object.entries(definition.derived)) columns.push({
			name: field,
			type,
			nullable: true,
			...multi ? { multi } : {}
		});
		else columns.push(integer(SHARD_COLUMN), ...[...definition.counters, ...definition.gauges].map((metric) => integer(metric)), ...definition.distinct.map((metric) => ({
			name: metric,
			type: "string",
			nullable: true
		})));
		for (const { counter } of referencedBy) if (counter !== void 0) columns.push(integer(counter, true));
		columns.push(integer("_v", true));
		models.set(name, {
			module: module.id,
			model,
			definition,
			table: {
				name,
				columns,
				key: definition.kind === "aggregate" ? [...definition.key, SHARD_COLUMN] : [...definition.key],
				indexes: indexesOf(definition),
				...physicalRetention(definition)
			},
			references: references.filter(({ table }) => table === name),
			referencedBy,
			roots: new Map(Object.entries(definition.indexes).flatMap(([index, { root }]) => root === void 0 ? [] : [[index, tableName(module, root.model)]]))
		});
	}
	return {
		models,
		tables: [...models.values()].map(({ table }) => table)
	};
};
//#endregion
export { SHARD_COLUMN, resolveSchema, validateSchema };
