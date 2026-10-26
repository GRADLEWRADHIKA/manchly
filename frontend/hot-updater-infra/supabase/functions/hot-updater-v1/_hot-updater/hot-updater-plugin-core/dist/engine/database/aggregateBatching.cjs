const require_schema = require("../../serverPlugin/schema.cjs");
const require_errors = require("../../serverPlugin/errors.cjs");
require("../../database/adapter.cjs");
const require_values = require("../../database/values.cjs");
const require_engineAggregates = require("./engineAggregates.cjs");
//#region src/engine/database/aggregateBatching.ts
/** Log rows spread over 8 tables, each its own DynamoDB partition. */
const LOG_TABLES = [
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7
].map((at) => `aggregate_log_${at}`);
const LEASE_TABLE = "aggregate_lease";
const LEASE = { id: "compaction" };
/** How long a compaction holds the lease before another process may take it. */
const LEASE_MS = 3e4;
/**
* Default windows: log mode compacts every 60 seconds, since reads compact
* first; memory mode flushes every 15, since its window is what a crash
* loses.
*/
const WINDOW_MS = {
	log: 6e4,
	memory: 15e3
};
/** Log rows a compaction reads from each log table for one group. */
const LOG_PAGE = 200;
/**
* Groups one compaction applies: after a commit, so the request that runs
* it waits for one group; before a read; and on flush.
*/
const GROUPS = {
	commit: 1,
	read: 8,
	flush: 256
};
/** Tries per write after a conflict or a transient error. */
const ATTEMPTS = 5;
/** Aggregate rows a memory buffer holds before a commit waits for a flush. */
const MAX_BUFFERED = 1e4;
const log = require_schema.defineTable({
	id: {
		type: "string",
		maxLength: 32
	},
	/** One committed transaction's changes, one entry per aggregate row. */
	changes: { type: "string" }
}, {
	key: ["id"],
	indexes: { oldest: {
		eq: [],
		sort: ["id"]
	} }
});
/**
* Held by `holder` until `until`; the next compaction is due at `next`.
* `applied` lists the log rows a compaction has applied and not yet deleted,
* as `[log table's index, id]` pairs, so no compaction applies them again.
*/
const lease = require_schema.defineTable({
	id: {
		type: "string",
		maxLength: 16
	},
	holder: {
		type: "string",
		maxLength: 32
	},
	until: { type: "integer" },
	next: { type: "integer" },
	applied: { type: "string" }
}, { key: ["id"] });
/** The log and lease tables; an engine that batches has them in its schema. */
const aggregateBatchingModule = {
	id: "aggregateBatching",
	schema: {
		...Object.fromEntries(LOG_TABLES.map((table) => [table, log])),
		[LEASE_TABLE]: lease
	}
};
const shapeOf = (model) => model.definition;
const isBatched = (model) => model?.definition.kind === "aggregate" && shapeOf(model).batched === true;
const valuesOf = ({ deltas, sketches }) => ({
	...deltas,
	...sketches
});
/**
* Merges `values` into the change for `key`'s identity as `tx.aggregate`
* does: deltas add up and sketches merge. One constant `shardBy` keys each
* identity to one entry; the write picks the shard.
*/
const merge = (into, model, key, values) => require_engineAggregates.recordAggregate(into, model, Object.fromEntries(shapeOf(model).key.map((field, at) => [field, key[at]])), values, "");
const mergeAll = (into, changes) => {
	for (const change of changes) merge(into, change.model, change.key, valuesOf(change));
	return into;
};
/** A row's metrics as values to merge: counters, gauges, and the sketches it has. */
const metricsOf = (model, row) => {
	const { counters, gauges, distinct } = shapeOf(model);
	return Object.fromEntries([...[...counters, ...gauges].map((name) => [name, Number(row[name] ?? 0)]), ...distinct.flatMap((name) => row[name] === null || row[name] === void 0 ? [] : [[name, row[name]]])]);
};
/** A shard row before its first change: every metric zero or empty. */
const blank = (model, key) => {
	const { counters, gauges, distinct } = shapeOf(model);
	return Object.fromEntries([
		...model.table.key.map((column, at) => [column, key[at]]),
		...[...counters, ...gauges].map((name) => [name, 0]),
		...distinct.map((name) => [name, null]),
		["_v", 0]
	]);
};
/** Whether a change needs its row: sketches merge, and a gauge may reach zero. */
const rewrites = ({ model, deltas, sketches }) => Object.keys(sketches).length > 0 || shapeOf(model).gauges.some((gauge) => (deltas[gauge] ?? 0) !== 0);
const increment = ({ model, deltas }, key) => Object.values(deltas).some((delta) => delta !== 0) ? {
	type: "increment",
	table: model.table,
	key,
	by: deltas,
	init: blank(model, key)
} : void 0;
/**
* The guarded write that merges `change` into `current`: insert, patch, or
* delete at zero. Unlike a transaction's, a gauge may go below zero here: a
* shard row holds one writer's net changes, and reads sum every shard.
*/
const rewrite = (change, key, current) => {
	const { model } = change;
	const { table } = model;
	const { counters, gauges, distinct } = shapeOf(model);
	const base = current ?? blank(model, key);
	const sum = mergeAll(/* @__PURE__ */ new Map(), [change]);
	merge(sum, model, key, metricsOf(model, base));
	const set = valuesOf([...sum.values()][0]);
	if (current && Object.keys(set).every((name) => current[name] === set[name])) return void 0;
	const row = {
		...base,
		...set
	};
	const zero = distinct.length === 0 && [...counters, ...gauges].every((name) => Number(row[name]) === 0);
	if (current === null) return zero ? void 0 : {
		type: "insert",
		table,
		row
	};
	const guard = { v: Number(current["_v"]) };
	return zero ? {
		type: "delete",
		table,
		key,
		guard,
		previous: current
	} : {
		type: "patch",
		table,
		key,
		set,
		guard,
		previous: current
	};
};
/**
* The write for each change on its shard: a blind increment that creates
* the row for counters, and a guarded rewrite for gauges and sketches, whose
* rows are read in one batch per table.
*/
const compile = async (adapter, changes, shard) => {
	const keys = changes.map(({ model, key }) => [...key.slice(0, -1), shard(model)]);
	const reads = /* @__PURE__ */ new Map();
	changes.forEach((change, at) => {
		if (rewrites(change)) reads.set(change.model, [...reads.get(change.model) ?? [], at]);
	});
	const current = /* @__PURE__ */ new Map();
	await Promise.all([...reads].map(async ([model, positions]) => {
		const rows = await adapter.get(model.table, positions.map((at) => keys[at]));
		positions.forEach((at, index) => current.set(at, rows[index] ?? null));
	}));
	return changes.map((change, at) => current.has(at) ? rewrite(change, keys[at], current.get(at)) : increment(change, keys[at]));
};
const isOp = (op) => op !== void 0;
const sleep = (attempt) => new Promise((resolve) => setTimeout(resolve, Math.min(250, 5 * 2 ** attempt) * Math.random()));
/** Runs of one character, where shorter: a sparse sketch packs into a few. */
const pack = (text) => {
	const runs = (text.match(/(.)\1*/gsu) ?? []).flatMap((run) => [run[0], run.length]);
	return JSON.stringify(runs).length < JSON.stringify(text).length ? runs : text;
};
const unpack = (value) => Array.isArray(value) ? value.map((item, at) => at % 2 ? "" : item.repeat(value[at + 1])).join("") : value;
/** Raw deflate of `text` as base64, where the runtime has `CompressionStream`. */
const deflate = async (text) => {
	if (typeof CompressionStream === "undefined") return void 0;
	const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("deflate-raw"));
	let binary = "";
	for (const byte of new Uint8Array(await new Response(stream).arrayBuffer())) binary += String.fromCharCode(byte);
	return btoa(binary);
};
const inflate = (base64) => new Response(new Blob([Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
/**
* A log row's `changes`: entries of a table, an identity, and values, as
* JSON, or `z` and its deflate where shorter, so a row stays under the 1 KB
* that DynamoDB bills as one unit.
*/
const encode = async (changes) => {
	const json = JSON.stringify({
		v: 1,
		c: [...changes].map(({ model, key, deltas, sketches }) => {
			const packed = Object.entries(sketches).map(([name, sketch]) => [name, pack(sketch)]);
			const values = {
				...deltas,
				...Object.fromEntries(packed)
			};
			return [
				model.table.name,
				key.slice(0, -1),
				values
			];
		})
	});
	const zipped = await deflate(json);
	return zipped !== void 0 && zipped.length < json.length ? `z${zipped}` : json;
};
/**
* Batches changes to aggregates declared `batched`. A transaction records
* them without writing their rows; once it commits, "memory" mode keeps
* them in this process until its timer flushes them, and "log" mode has
* written them as one log row in the same atomic write, which a compaction
* later merges into the aggregates and deletes, atomically again, so each
* applies exactly once. One lease row keeps compactions one at a time.
*/
const createAggregateBatches = ({ engine, adapter, schema, batching: { mode = "log", windowMs = WINDOW_MS[mode] }, now }) => {
	if (!schema.models.has(LEASE_TABLE)) throw new require_errors.DatabaseTransactionError("An engine that batches aggregates needs aggregateBatchingModule in its schema.");
	const holder = crypto.randomUUID().replaceAll("-", "");
	const table = (name) => schema.models.get(name).table;
	const warned = /* @__PURE__ */ new Set();
	const warn = (what) => (error) => {
		if (warned.has(what)) return;
		warned.add(what);
		console.warn(`[hot-updater] Aggregate ${what} failed.`, error);
	};
	/** A log row's changes, or undefined when it names an aggregate or metric this schema lacks. */
	const decode = async (text) => {
		const changes = /* @__PURE__ */ new Map();
		try {
			const json = text.startsWith("z") ? await inflate(text.slice(1)) : text;
			const { c } = JSON.parse(json);
			for (const [name, identity, values] of c) {
				const model = schema.models.get(name);
				if (!isBatched(model)) return void 0;
				const unpacked = Object.entries(values).map(([metric, value]) => [metric, unpack(value)]);
				merge(changes, model, [...identity, 0], Object.fromEntries(unpacked));
			}
		} catch (error) {
			warn("log decoding")(error);
			return;
		}
		return changes;
	};
	/**
	* Writes changes in atomic chunks within `fits`, and returns the ones it
	* could not apply. A write whose outcome is unknown is dropped, never
	* resent, so no change applies twice.
	*/
	const apply = async (changes, shard) => {
		let rest = changes;
		let ops = [];
		let read = true;
		for (let failures = 0; rest.length > 0 && failures < ATTEMPTS;) try {
			if (read) ops = await compile(adapter, rest, shard);
			let size = rest.length;
			const chunk = () => ops.slice(0, size).filter(isOp);
			while (size > 1 && !adapter.fits(chunk())) size = Math.ceil(size / 2);
			let result = { ok: true };
			if (chunk().length > 0) result = await adapter.write(chunk()).catch((error) => {
				warn("flush")(error);
				return { ok: true };
			});
			read = !result.ok && !("retry" in result);
			if (result.ok) {
				rest = rest.slice(size);
				ops = ops.slice(size);
				failures = 0;
			} else {
				failures += 1;
				if (!read) await sleep(failures);
			}
		} catch (error) {
			warn("flush")(error);
			return rest;
		}
		return rest;
	};
	let buffer = /* @__PURE__ */ new Map();
	let timer;
	let flushing;
	const shards = /* @__PURE__ */ new Map();
	/** Each process writes its own shard, so flushes of two processes rarely meet. */
	const processShard = (model) => {
		if (!shards.has(model)) shards.set(model, Math.floor(Math.random() * shapeOf(model).shards));
		return shards.get(model);
	};
	const schedule = () => {
		if (timer !== void 0 || buffer.size === 0) return;
		timer = setTimeout(() => {
			timer = void 0;
			flushBuffer();
		}, windowMs);
		timer.unref?.();
	};
	/** Never rejects: what it cannot apply goes back into the buffer. */
	const flushBuffer = () => flushing ??= (async () => {
		clearTimeout(timer);
		timer = void 0;
		const pending = [...buffer.values()];
		buffer = /* @__PURE__ */ new Map();
		mergeAll(buffer, await apply(pending, processShard));
	})().catch(warn("flush")).finally(() => {
		flushing = void 0;
		schedule();
	});
	let nextDue = 0;
	let compacting;
	/** Log rows this process read, by `[log table's index, id]`, for the deletes after a group. */
	const known = /* @__PURE__ */ new Map();
	const idOf = (shard, id) => JSON.stringify([shard, id]);
	/** The lease row as stored once `set` is written over it. */
	const leaseOp = (held, set) => {
		const next = {
			...held,
			...set,
			_v: Number(held._v) + 1
		};
		return {
			op: {
				type: "patch",
				table: table(LEASE_TABLE),
				key: [LEASE.id],
				set,
				guard: { v: Number(held._v) },
				previous: held
			},
			next
		};
	};
	/** The lease row as stored after this process takes it, or undefined when it is held or not due. */
	const takeLease = (force) => engine.transaction(async (tx) => {
		const at = now();
		const held = await tx.findOne(LEASE_TABLE, LEASE);
		const fields = {
			holder,
			until: at + LEASE_MS
		};
		if (held === null) {
			const row = {
				...LEASE,
				...fields,
				next: 0,
				applied: "[]"
			};
			tx.create(LEASE_TABLE, row);
			return {
				...row,
				_v: 0
			};
		}
		nextDue = Number(held.next);
		if (held.holder !== holder && Number(held.until) > at || !force && nextDue > at) return void 0;
		tx.update(LEASE_TABLE, held, fields);
		return {
			...held,
			...fields,
			_v: Number(held._v) + 1
		};
	});
	/**
	* Writes `ops` once, retrying transient errors; true when it committed.
	* A conflict leaves its log rows for the next compaction; a write whose
	* outcome is unknown throws, and the next compaction reads what it did.
	*/
	const commit = async (ops) => {
		for (let failures = 0; failures < ATTEMPTS; failures += 1) {
			const result = await adapter.write(ops);
			if (result.ok) return true;
			if (!("retry" in result)) return false;
			await sleep(failures);
		}
		return false;
	};
	/** Deletes the log rows `held` lists as applied, in parallel writes; true once none is left. */
	const deleteApplied = async (held) => {
		const applied = JSON.parse(String(held.applied));
		await Promise.all(LOG_TABLES.map(async (name, shard) => {
			const ids = applied.flatMap(([at, id]) => at === shard && !known.has(idOf(at, id)) ? [id] : []);
			if (ids.length === 0) return;
			const rows = await adapter.get(table(name), ids.map((id) => [id]));
			for (const row of rows) if (row) known.set(idOf(shard, row.id), row);
		}));
		const rows = applied.flatMap(([shard, id]) => {
			const row = known.get(idOf(shard, id));
			return row === void 0 ? [] : [{
				shard,
				row
			}];
		});
		if (adapter.deleteConsumed && await Promise.all(LOG_TABLES.map((name, at) => {
			const own = rows.flatMap(({ shard, row }) => shard === at ? [row] : []);
			return own.length > 0 && adapter.deleteConsumed(table(name), own);
		})).then(() => true, (error) => (warn("log cleanup")(error), false))) {
			for (const [shard, id] of applied) known.delete(idOf(shard, id));
			return true;
		}
		const deletes = rows.map(({ shard, row }) => {
			const guard = { v: Number(row["_v"]) };
			return {
				type: "delete",
				table: table(LOG_TABLES[shard]),
				key: [String(row.id)],
				guard,
				previous: row
			};
		});
		let size = deletes.length;
		while (size > 1 && !adapter.fits(deletes.slice(0, size))) size = Math.ceil(size / 2);
		const chunks = [];
		for (let at = 0; at < deletes.length; at += size) chunks.push(deletes.slice(at, at + size));
		if ((await Promise.all(chunks.map(commit))).includes(false)) return false;
		for (const [shard, id] of applied) known.delete(idOf(shard, id));
		return true;
	};
	/**
	* The oldest pending log rows this schema can read, a page from each
	* table; `more` when a page was full, so more may wait.
	*/
	const readLogs = async () => {
		let more = false;
		return {
			logs: (await Promise.all(LOG_TABLES.map(async (name, shard) => {
				const page = await engine.reads.findMany(name, {
					index: "oldest",
					limit: LOG_PAGE
				});
				more ||= page.next !== void 0;
				return (await Promise.all(page.rows.map(async (row) => ({
					shard,
					row,
					changes: await decode(String(row.changes))
				})))).flatMap(({ changes, ...entry }) => changes === void 0 ? [] : [{
					...entry,
					changes
				}]);
			}))).flat().sort((left, right) => require_values.compareUtf8(String(left.row.id), String(right.row.id))),
			more
		};
	};
	const rowsFor = async (changes) => (await compile(adapter, changes, () => 0)).filter(isOp);
	/**
	* Applies the oldest pending log rows whose merged changes fit in one
	* atomic write with the lease, which lists them as applied; the rows are
	* deleted after it. A log row too large for one write applies in parts,
	* keeping the rest in it. Returns the lease after the write and how many
	* log rows it applied whole, or undefined when a conflict stopped it.
	*/
	const applyGroup = async (held, logs) => {
		for (let count = logs.length; count > 0; count = Math.floor(count / 2)) {
			const batch = logs.slice(0, count);
			const changes = mergeAll(/* @__PURE__ */ new Map(), batch.flatMap((entry) => [...entry.changes.values()]));
			const applied = batch.map(({ shard, row }) => [shard, row.id]);
			const lease = leaseOp(held, { applied: JSON.stringify(applied) });
			const ops = [...await rowsFor([...changes.values()]), lease.op];
			if (!adapter.fits(ops)) continue;
			for (const { shard, row } of batch) known.set(idOf(shard, row.id), row);
			return await commit(ops) ? {
				held: lease.next,
				count
			} : void 0;
		}
		const [{ shard, row, changes }] = logs;
		const name = LOG_TABLES[shard];
		const entries = [...changes.values()];
		for (let take = entries.length - 1; take > 0; take = Math.floor(take / 2)) {
			const kept = {
				type: "patch",
				table: table(name),
				key: [String(row.id)],
				set: { changes: await encode(entries.slice(take)) },
				guard: { v: Number(row["_v"]) },
				previous: row
			};
			const lease = leaseOp(held, {});
			const ops = [
				...await rowsFor(entries.slice(0, take)),
				kept,
				lease.op
			];
			if (adapter.fits(ops)) return await commit(ops) ? {
				held: lease.next,
				count: 0
			} : void 0;
		}
		throw new require_errors.DatabaseTransactionError(`${name}: one aggregate change does not fit in one write.`);
	};
	/**
	* Applies up to `groups` groups under the lease, deleting each group's log
	* rows before the next; the next compaction is due at once when some are
	* left. The lease release clears the applied list once its rows are gone.
	*/
	const run = async (force, groups) => {
		let held = await takeLease(force);
		if (held === void 0) return;
		let pending = true;
		let clear = false;
		try {
			for (let group = 0;; group += 1) {
				clear = await deleteApplied(held);
				if (!clear || !pending || group === groups) break;
				const { logs, more } = await readLogs();
				if (logs.length === 0) {
					pending = false;
					break;
				}
				const applied = await applyGroup(held, logs);
				if (applied === void 0) break;
				[held, clear] = [applied.held, false];
				pending = more || applied.count < logs.length;
			}
		} finally {
			nextDue = now() + (pending ? 0 : windowMs);
			const set = {
				until: 0,
				next: nextDue,
				...clear ? { applied: "[]" } : {}
			};
			await commit([leaseOp(held, set).op]);
			known.clear();
		}
	};
	/** One compaction at a time in this process; never rejects. */
	const compact = (force, groups) => compacting ??= run(force, groups).catch(warn("compaction")).finally(() => {
		compacting = void 0;
	});
	let checking;
	/** Whether any log row waits; reads at once share one check. */
	const hasPending = () => checking ??= Promise.all(LOG_TABLES.map((name) => engine.reads.findMany(name, {
		index: "oldest",
		limit: 1
	}))).then((pages) => pages.some((page) => page.rows.length > 0)).finally(() => {
		checking = void 0;
	});
	/** Takes a committed transaction's changes; never rejects, since the transaction already committed. */
	const committed = async (changes) => {
		if (mode === "log") {
			if (now() >= nextDue) await compact(false, GROUPS.commit);
			return;
		}
		mergeAll(buffer, changes.values());
		schedule();
		if (buffer.size >= MAX_BUFFERED) await flushBuffer();
	};
	const flush = async () => {
		await flushBuffer();
		if (mode === "log" && await hasPending()) await compact(true, GROUPS.flush);
	};
	return {
		async transaction(fn) {
			let changes = /* @__PURE__ */ new Map();
			const result = await engine.transaction(async (tx) => {
				const attempt = /* @__PURE__ */ new Map();
				changes = attempt;
				let open = true;
				let failure;
				const aggregate = (name, identity, values, options) => {
					const model = schema.models.get(name);
					if (!isBatched(model)) return tx.aggregate(name, identity, values, options);
					try {
						if (!open) throw new require_errors.DatabaseTransactionError("The transaction has ended.");
						require_engineAggregates.recordAggregate(attempt, model, identity, values, options?.shardBy);
					} catch (error) {
						failure ??= { error };
						throw error;
					}
				};
				try {
					const value = await fn({
						...tx,
						aggregate
					});
					if (failure) throw failure.error;
					if (mode === "log" && attempt.size > 0) {
						const id = `${now().toString(36).padStart(9, "0")}${holder.slice(0, 8)}${crypto.randomUUID().slice(0, 8)}`;
						const shard = Math.floor(Math.random() * LOG_TABLES.length);
						const merged = mergeAll(/* @__PURE__ */ new Map(), attempt.values());
						tx.create(LOG_TABLES[shard], {
							id,
							changes: await encode(merged.values())
						});
					}
					return value;
				} finally {
					open = false;
				}
			});
			if (changes.size > 0) await committed(changes);
			return result;
		},
		async beforeRead(name) {
			if (!isBatched(schema.models.get(name))) return;
			if (buffer.size > 0 || flushing !== void 0) await flushBuffer();
			if (mode === "log") {
				if (await hasPending().catch((error) => {
					warn("read")(error);
					return false;
				})) await compact(true, GROUPS.read);
			}
		},
		flush,
		async dispose() {
			clearTimeout(timer);
			timer = void 0;
			await flush();
		}
	};
};
//#endregion
exports.aggregateBatchingModule = aggregateBatchingModule;
exports.createAggregateBatches = createAggregateBatches;
