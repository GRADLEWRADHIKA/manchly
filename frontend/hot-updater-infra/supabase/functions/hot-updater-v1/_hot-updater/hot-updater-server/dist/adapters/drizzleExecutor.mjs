import { sql } from "drizzle-orm";
//#region src/adapters/drizzleExecutor.ts
const SUPPORTED_DRIZZLE_DRIVERS = "node-postgres, postgres-js, PGlite, or Neon over WebSockets for PostgreSQL; mysql2 for MySQL; libSQL, better-sqlite3, or bun:sqlite for SQLite";
var DrizzleTransactionUnsupportedError = class extends Error {
	name = "DrizzleTransactionUnsupportedError";
	constructor(cause) {
		super(`This Drizzle driver cannot run interactive transactions, which Hot Updater needs. Use ${SUPPORTED_DRIZZLE_DRIVERS}.`, { cause });
	}
};
/** The SQL core's statement as Drizzle SQL, each placeholder bound as a parameter. */
const toSql = (dialect, { sql: text, params }) => {
	const pattern = dialect === "postgresql" ? /\$(\d+)/gu : /\?/gu;
	const chunks = [];
	let last = 0;
	let next = 0;
	for (const match of text.matchAll(pattern)) {
		chunks.push(sql.raw(text.slice(last, match.index)));
		const position = dialect === "postgresql" ? Number(match[1]) - 1 : next++;
		chunks.push(sql`${sql.param(params[position])}`);
		last = match.index + match[0].length;
	}
	chunks.push(sql.raw(text.slice(last)));
	return sql.join(chunks);
};
const over = (dialect, runner) => ({ async execute(statement) {
	const query = toSql(dialect, statement);
	if (dialect === "sqlite") return /^\s*SELECT\b/iu.test(statement.sql) ? {
		rows: await runner.all(query),
		changes: 0
	} : {
		rows: [],
		changes: changesOf(await runner.run(query))
	};
	const result = await runner.execute(query);
	const value = dialect === "mysql" && Array.isArray(result) ? result[0] : result;
	return {
		rows: Array.isArray(value) ? value : value.rows ?? [],
		changes: Array.isArray(value) && dialect === "mysql" ? 0 : changesOf(value)
	};
} });
const changesOf = (result) => {
	const record = result ?? {};
	const meta = record.meta;
	return Number(record.rowCount ?? record.affectedRows ?? record.rowsAffected ?? record.changes ?? record.count ?? meta?.changes ?? 0);
};
/**
* The SQL core's executor over a Drizzle database, or a function that
* returns one. Async drivers run Drizzle's transactions; sync SQLite drivers
* run one statement at a time, beginning transactions with BEGIN IMMEDIATE.
* First use checks that the driver can run a transaction at all.
*/
const drizzleExecutor = (source, dialect) => {
	const isSync = (runner) => dialect === "sqlite" && runner.resultKind === "sync";
	let ready;
	const resolve = () => {
		ready ??= (async () => {
			const runner = await (typeof source === "function" ? source() : source);
			if (isSync(runner)) return runner;
			let started = false;
			try {
				if (typeof runner.transaction !== "function") throw new TypeError("The Drizzle database has no transaction().");
				await runner.transaction(async () => {
					started = true;
				});
			} catch (error) {
				if (!started) throw new DrizzleTransactionUnsupportedError(error);
				throw error;
			}
			return runner;
		})();
		ready.catch(() => {
			ready = void 0;
		});
		return ready;
	};
	let queue = Promise.resolve();
	const serial = (task) => {
		const result = queue.then(task);
		queue = result.catch(() => void 0);
		return result;
	};
	return {
		dialect,
		async execute(statement) {
			const runner = await resolve();
			const run = () => over(dialect, runner).execute(statement);
			return isSync(runner) ? serial(run) : run();
		},
		async transaction(fn) {
			const runner = await resolve();
			if (!isSync(runner)) return await runner.transaction((tx) => fn(over(dialect, tx)));
			return serial(async () => {
				const connection = over(dialect, runner);
				const raw = (text) => connection.execute({
					sql: text,
					params: []
				});
				await raw("BEGIN IMMEDIATE");
				try {
					const result = await fn(connection);
					await raw("COMMIT");
					return result;
				} catch (error) {
					await raw("ROLLBACK").catch(() => void 0);
					throw error;
				}
			});
		}
	};
};
//#endregion
export { DrizzleTransactionUnsupportedError, SUPPORTED_DRIZZLE_DRIVERS, drizzleExecutor };
