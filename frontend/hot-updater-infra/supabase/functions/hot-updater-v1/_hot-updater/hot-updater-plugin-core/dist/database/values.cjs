const require_adapter = require("./adapter.cjs");
//#region src/database/values.ts
var DatabaseValueError = class extends Error {
	name = "DatabaseValueError";
};
/**
* Compares strings in UTF-8 byte order, which is Unicode code point order:
* the order the engine sorts string keys in. A plugin that merges rows from
* several reads, as Insights does, keeps that order with it.
*/
const compareUtf8 = (left, right) => {
	let leftIndex = 0;
	let rightIndex = 0;
	while (leftIndex < left.length && rightIndex < right.length) {
		const leftPoint = left.codePointAt(leftIndex);
		const rightPoint = right.codePointAt(rightIndex);
		if (leftPoint !== rightPoint) return leftPoint < rightPoint ? -1 : 1;
		leftIndex += leftPoint > 65535 ? 2 : 1;
		rightIndex += rightPoint > 65535 ? 2 : 1;
	}
	const leftDone = leftIndex >= left.length;
	return leftDone === rightIndex >= right.length ? 0 : leftDone ? -1 : 1;
};
/** Orders strings by UTF-8 bytes, numbers numerically, and false before true. */
const compareKeyValues = (left, right) => {
	if (typeof left === "string" && typeof right === "string") return compareUtf8(left, right);
	if (typeof left === "number" && typeof right === "number") return left < right ? -1 : left > right ? 1 : 0;
	if (typeof left === "boolean" && typeof right === "boolean") return Number(left) - Number(right);
	throw new DatabaseValueError(`Cannot compare ${typeof left} with ${typeof right}.`);
};
/** Compares tuples element by element; a shorter equal prefix sorts first. */
const compareTuples = (left, right) => {
	for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
		const result = compareKeyValues(left[index], right[index]);
		if (result !== 0) return result;
	}
	return left.length - right.length;
};
/** JSON text with object keys sorted, so a value compares equal after a store reorders map keys. */
const canonicalJson = (value) => JSON.stringify(value ?? null, (_, inner) => inner !== null && typeof inner === "object" && !Array.isArray(inner) ? Object.fromEntries(Object.entries(inner).sort(([left], [right]) => compareUtf8(left, right))) : inner);
const isKeyValue = (value) => typeof value === "string" || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value);
/** Every `eq` tuple a row is indexed under; none when an index field is null. */
const indexEntries = (table, index, row) => {
	if (index.sort.some((column) => !isKeyValue(row[column]))) return [];
	let entries = [[]];
	for (const column of index.eq) {
		const value = row[column];
		const values = require_adapter.findPhysicalColumn(table, column).multi ? Array.isArray(value) ? value.filter(isKeyValue) : [] : isKeyValue(value) ? [value] : [];
		if (values.length === 0) return [];
		entries = entries.flatMap((entry) => [...new Set(values)].map((item) => [...entry, item]));
	}
	return entries;
};
/** The row's position in an index read, following `indexOrderColumns`. */
const indexOrderTuple = (table, index, row) => require_adapter.indexOrderColumns(table, index).map((column) => {
	const value = row[column];
	if (!isKeyValue(value)) throw new DatabaseValueError(`${table.name}.${column} is not orderable for index ${index.name}.`);
	return value;
});
const satisfiesBound = (tuple, bound, side) => {
	if (bound === void 0) return true;
	const result = compareTuples(tuple.slice(0, bound.values.length), bound.values);
	if (result === 0) return bound.inclusive;
	return side === "lower" ? result > 0 : result < 0;
};
/** Whether a stored row belongs to the result range of a query. */
const matchesQuery = (table, index, request, row) => indexEntries(table, index, row).some((entry) => compareTuples(entry, request.eq) === 0) && satisfiesBound(indexOrderTuple(table, index, row), request.lower, "lower") && satisfiesBound(indexOrderTuple(table, index, row), request.upper, "upper");
const INTEGER_TEXT = /^-?\d+$/u;
const NUMBER_TEXT = /^-?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/iu;
const toNumber = (raw, integer) => {
	const text = typeof raw === "bigint" ? raw.toString() : typeof raw === "string" ? raw : typeof raw === "object" && raw !== null && "toString" in raw ? String(raw) : void 0;
	const value = typeof raw === "number" ? raw : text !== void 0 && (integer ? INTEGER_TEXT : NUMBER_TEXT).test(text) ? Number(text) : NaN;
	if (integer ? !Number.isSafeInteger(value) : !Number.isFinite(value)) throw new DatabaseValueError(`Expected a ${integer ? "safe integer" : "finite number"}.`);
	return value;
};
const toBoolean = (raw) => {
	if (raw === true || raw === 1 || raw === 1n || raw === "1" || raw === "t") return true;
	if (raw === false || raw === 0 || raw === 0n || raw === "0" || raw === "f") return false;
	if (raw === "true" || raw === "false") return raw === "true";
	throw new DatabaseValueError("Expected a boolean.");
};
const toScalar = (column, raw) => {
	switch (column.type) {
		case "string":
			if (typeof raw !== "string") throw new DatabaseValueError(`Expected a string in ${column.name}.`);
			return raw;
		case "integer":
		case "number": return toNumber(raw, column.type === "integer");
		case "boolean": return toBoolean(raw);
		case "json": return raw;
	}
};
/** Converts a backend value (int8 text, BigInt, Decimal, 0/1, JSON text) to a stored value. */
const normalizeStoredValue = (column, raw, options) => {
	if (raw === null || raw === void 0) return null;
	const parsed = options.jsonText && (column.multi || column.type === "json") && typeof raw === "string" ? JSON.parse(raw) : raw;
	if (!column.multi) return toScalar(column, parsed);
	if (!Array.isArray(parsed) || parsed.length > 16) throw new DatabaseValueError(`Expected at most 16 values in ${column.name}.`);
	return parsed.map((item) => toScalar(column, item));
};
/** Converts every column of a backend row; unknown backend columns are dropped. */
const normalizeStoredRow = (table, raw, options) => Object.fromEntries(table.columns.map((column) => [column.name, normalizeStoredValue(column, raw[column.name], options)]));
//#endregion
exports.DatabaseValueError = DatabaseValueError;
exports.canonicalJson = canonicalJson;
exports.compareKeyValues = compareKeyValues;
exports.compareTuples = compareTuples;
exports.compareUtf8 = compareUtf8;
exports.indexEntries = indexEntries;
exports.indexOrderTuple = indexOrderTuple;
exports.isKeyValue = isKeyValue;
exports.matchesQuery = matchesQuery;
exports.normalizeStoredRow = normalizeStoredRow;
exports.normalizeStoredValue = normalizeStoredValue;
