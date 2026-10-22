import { expiresAt, findPhysicalIndex, indexOrderColumns, rowKey } from "../../../database/adapter.mjs";
import { canonicalJson, compareUtf8, indexEntries, indexOrderTuple, matchesQuery } from "../../../database/values.mjs";
import { DatabaseAdapterContractError } from "../../../database/verifyAdapter.mjs";
//#region src/engine/database/kv/kvAdapter.ts
const SEPARATOR = "";
/**
* Order-preserving text for key values; each value ends in the lowest code
* point any encoding uses. `createKvAdapter` stores a row as the item with
* the table's name as `pk` and its key's text as `sk`, so tooling that
* writes a store's items itself, as the AWS setup's settings items do, keys
* them with it.
*/
const encodeKvKey = (values) => values.map((value) => {
	if (typeof value === "boolean") return `${Number(value)}${SEPARATOR}`;
	if (typeof value === "number") {
		const view = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
		view.setFloat64(0, value === 0 ? 0 : value);
		const mask = view.getUint32(0) >>> 31 ? [-1, -1] : [1 << 31, 0];
		return `${[0, 4].map((at, word) => ((view.getUint32(at) ^ mask[word]) >>> 0).toString(16).padStart(8, "0")).join("")}${SEPARATOR}`;
	}
	let text = "";
	for (const char of value) text += char < "" ? `\u0002${String.fromCharCode(char.charCodeAt(0) + 1)}` : char;
	return `${text}${SEPARATOR}`;
}).join("");
/** The first sort key after every key that starts with `prefix`. */
const pastPrefix = (prefix) => `${prefix.slice(0, -1)}\u0002`;
/** A unique item's sort key, and an index item's when its order is empty. */
const ONLY = "#";
/** An index whose eq and order columns are the key, in order, reads the row items. */
const inKeyOrder = (table, index) => {
	const columns = [...index.eq, ...indexOrderColumns(table, index)];
	return !index.unique && columns.length === table.key.length && columns.every((column, position) => column === table.key[position]);
};
const same = (left, right, columns) => columns.every((name) => canonicalJson(left[name]) === canonicalJson(right[name]));
/**
* The database adapter over a key-value store. A row is one item at
* `pk = <table>`, `sk = enc(key)`; each index not in key order adds an item
* per entry at `pk = <table>#<index>#enc(eq)`, `sk = enc(order)`, and each
* unique entry one item at `sk = "#"`, written only where no other row holds
* it. Index items hold a copy of the row without `_v` or counters, so an
* increment, which changes only those, never makes them stale.
*/
const createKvAdapter = ({ store, tablePrefix = "" }) => {
	const layouts = /* @__PURE__ */ new WeakMap();
	const layoutOf = (table) => {
		const known = layouts.get(table);
		if (known) return known;
		const counters = table.columns.filter((column) => column.default !== void 0 && column.name !== "_v").map((column) => column.name);
		const layout = {
			table,
			rows: tablePrefix + table.name,
			copied: table.columns.map((column) => column.name).filter((name) => name !== "_v" && !counters.includes(name)),
			counters,
			indexed: table.indexes.filter((index) => !inKeyOrder(table, index))
		};
		layouts.set(table, layout);
		return layout;
	};
	const rowItem = (layout, key) => ({
		pk: layout.rows,
		sk: encodeKvKey(key)
	});
	const partition = (layout, index, eq) => `${layout.rows}#${index.name}#${encodeKvKey(eq)}`;
	const copyOf = (layout, row) => Object.fromEntries(layout.copied.map((name) => [name, row[name] ?? null]));
	/** The expiry every item of `row` carries, for a table with retention. */
	const stamp = (table, row) => {
		const at = row && expiresAt(table, row);
		return at === void 0 ? {} : { expiresAt: at };
	};
	/** Every index and unique item a row has, by address. */
	const itemsOf = (layout, row) => {
		const items = /* @__PURE__ */ new Map();
		for (const index of row === null ? [] : layout.indexed) for (const eq of indexEntries(layout.table, index, row)) {
			const pk = partition(layout, index, eq);
			const sk = index.unique ? ONLY : encodeKvKey(indexOrderTuple(layout.table, index, row)) || ONLY;
			items.set(JSON.stringify([pk, sk]), {
				key: {
					pk,
					sk
				},
				unique: index.unique === true
			});
		}
		return items;
	};
	/** Moves a row's index items from `before` to `after`; a unique entry is taken only where no row holds it. */
	const indexOps = (layout, before, after) => {
		const old = itemsOf(layout, before);
		const next = itemsOf(layout, after);
		const ops = [...old].filter(([id]) => !next.has(id)).map(([, item]) => ({
			type: "delete",
			key: item.key
		}));
		const copy = after && copyOf(layout, after);
		const unchanged = before !== null && copy !== null && same(before, copy, layout.copied);
		for (const [id, item] of next) {
			if (old.has(id) && unchanged) continue;
			const taken = item.unique && !old.has(id);
			ops.push({
				type: "put",
				key: item.key,
				value: copy,
				condition: taken ? { exists: false } : void 0,
				...stamp(layout.table, after)
			});
		}
		return ops;
	};
	/** The item ops of one adapter op: its row item first, then its index items. */
	const plan = (op) => {
		const layout = layoutOf(op.table);
		const key = rowItem(layout, op.type === "insert" ? rowKey(op.table, op.row) : op.key);
		const guard = op.type === "insert" ? { exists: false } : op.guard;
		const condition = guard && ("v" in guard ? { v: guard.v } : guard);
		switch (op.type) {
			case "check": return [{
				type: "check",
				key,
				condition
			}];
			case "increment":
				if (layout.indexed.length > 0 && (op.init !== void 0 || Object.keys(op.by).some((name) => layout.copied.includes(name)))) throw new DatabaseAdapterContractError(`${op.table.name} has index copies: an increment may change only counters of an existing row.`);
				return [{
					type: "add",
					key,
					by: {
						...op.by,
						["_v"]: 1
					},
					init: op.init,
					condition: condition ?? (op.init ? void 0 : { exists: true }),
					...stamp(op.table, op.init)
				}];
			case "delete": return [{
				type: "delete",
				key,
				condition
			}, ...indexOps(layout, op.previous, null)];
			default: {
				const before = op.type === "insert" ? null : op.previous;
				const row = op.type === "insert" ? op.row : {
					...op.previous,
					...op.set,
					["_v"]: op.guard.v + 1
				};
				return [{
					type: "put",
					key,
					value: row,
					condition,
					...stamp(op.table, row)
				}, ...indexOps(layout, before, row)];
			}
		}
	};
	/**
	* One op per item. Only unique items of two rows can meet: one op frees
	* the value and another takes it. That becomes one unconditional put, as
	* the freeing op's guard already holds the value's owner. Two rows taking
	* one value fail at the later op.
	*/
	const compile = (ops) => {
		const items = /* @__PURE__ */ new Map();
		for (const [origin, op] of ops.entries()) for (const kv of plan(op)) {
			const id = JSON.stringify([kv.key.pk, kv.key.sk]);
			const earlier = items.get(id);
			const put = [earlier, {
				op: kv,
				origin
			}].find((planned) => planned?.op.type === "put");
			if (earlier === void 0) items.set(id, {
				op: kv,
				origin
			});
			else if (put?.op.type === "put" && [earlier.op, kv].some(({ type }) => type === "delete")) items.set(id, {
				op: {
					...put.op,
					condition: void 0
				},
				origin
			});
			else return { failedOp: origin };
		}
		return { items: [...items.values()] };
	};
	const encoder = new TextEncoder();
	const sizeOf = ({ op }) => encoder.encode(op.key.pk + op.key.sk + JSON.stringify(op.type === "put" ? op.value : op.type === "add" ? op.init : null)).length;
	/** Fills counters from the rows; a row that still equals its copy is returned whole, `_v` included. */
	const complete = async (layout, copies) => {
		if (layout.counters.length === 0 || copies.length === 0) return copies;
		const rows = await store.get(copies.map((copy) => rowItem(layout, rowKey(layout.table, copy))));
		return copies.map((copy, at) => {
			const row = rows[at];
			if (row && same(row, copy, layout.copied)) return row;
			const counters = layout.counters.map((name) => [name, row?.[name] ?? 0]);
			return {
				...copy,
				...Object.fromEntries(counters)
			};
		});
	};
	/**
	* A request's sort keys within its partition, from `gte` up to `lt`; null
	* when none can match. Every encoding ends in the separator, so the keys
	* that start with a prefix end right before `pastPrefix` of it.
	*/
	const rangeOf = (prefix, request) => {
		const edge = (bound, lower) => {
			if (bound === void 0) return prefix === "" ? void 0 : lower ? prefix : pastPrefix(prefix);
			const text = prefix + encodeKvKey(bound.values);
			if (text === "") return bound.inclusive ? void 0 : null;
			return lower === bound.inclusive ? text : pastPrefix(text);
		};
		const gte = edge(request.lower, true);
		const lt = edge(request.upper, false);
		if (gte === null || lt === null) return null;
		if (gte !== void 0 && lt !== void 0 && compareUtf8(gte, lt) >= 0) return null;
		if (lt === void 0) return {
			gte,
			lt
		};
		return {
			gte,
			lt,
			lte: lt.endsWith(SEPARATOR) ? lt.slice(0, -1) : lt
		};
	};
	return {
		id: store.id,
		fits(ops) {
			const { items } = compile(ops);
			if (items === void 0) return true;
			const { items: most, bytes, itemBytes = bytes, keyBytes } = store.limits;
			const sizes = items.map(sizeOf);
			const length = (text) => encoder.encode(text).length;
			return items.length <= most && sizes.reduce((sum, size) => sum + size, 0) <= bytes && sizes.every((size) => size <= itemBytes) && (keyBytes === void 0 || items.every(({ op }) => length(op.key.pk) <= keyBytes.pk && length(op.key.sk) <= keyBytes.sk));
		},
		get: (table, keys) => store.get(keys.map((key) => rowItem(layoutOf(table), key))),
		async query(table, request) {
			const layout = layoutOf(table);
			const index = findPhysicalIndex(table, request.index);
			if (index.unique) {
				const key = {
					pk: partition(layout, index, request.eq),
					sk: ONLY
				};
				const [copy] = await store.get([key]);
				const found = copy && matchesQuery(table, index, request, copy);
				return complete(layout, found ? [copy] : []);
			}
			const own = inKeyOrder(table, index);
			const range = rangeOf(own ? encodeKvKey(request.eq) : "", request);
			if (range === null) return [];
			const pk = own ? layout.rows : partition(layout, index, request.eq);
			const rows = [];
			let after;
			while (rows.length < request.limit) {
				const { items, more } = await store.query({
					pk,
					...range,
					order: request.order,
					limit: request.limit - rows.length,
					after
				});
				rows.push(...items.map((item) => item.value));
				if (!more || items.length === 0) break;
				after = items.at(-1).sk;
			}
			return own ? rows : complete(layout, rows);
		},
		async write(ops) {
			const { items, failedOp } = compile(ops);
			if (items === void 0) return {
				ok: false,
				failedOp
			};
			const result = await store.write(items.map(({ op }) => op));
			return !result.ok && "failedOp" in result ? {
				ok: false,
				failedOp: items[result.failedOp].origin
			} : result;
		},
		...store.deleteConsumed === void 0 ? {} : { deleteConsumed: (table, rows) => {
			const layout = layoutOf(table);
			return store.deleteConsumed(rows.flatMap((row) => [rowItem(layout, rowKey(table, row)), ...[...itemsOf(layout, row).values()].map(({ key }) => key)]));
		} },
		migrations: { apply: async () => store.migrations?.apply() },
		...store.dispose === void 0 ? {} : { dispose: () => store.dispose() }
	};
};
//#endregion
export { createKvAdapter, encodeKvKey };
