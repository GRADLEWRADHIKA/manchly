let kysely = require("kysely");
//#region src/adapters/kyselyExecutor.ts
const over = (runner) => ({ async execute({ sql, params }) {
	const result = await runner.executeQuery(kysely.CompiledQuery.raw(sql, [...params]));
	return {
		rows: result.rows,
		changes: Number(result.numAffectedRows ?? 0n)
	};
} });
const raw = (runner, sql) => runner.executeQuery(kysely.CompiledQuery.raw(sql));
/**
* The SQL core's executor over a Kysely instance: statements run as raw
* compiled queries. SQLite transactions begin with BEGIN IMMEDIATE on one
* connection; other dialects use Kysely's transactions.
*/
const kyselyExecutor = (db, dialect) => ({
	dialect,
	...over(db),
	transaction: (fn) => dialect === "sqlite" ? db.connection().execute(async (connection) => {
		await raw(connection, "BEGIN IMMEDIATE");
		try {
			const result = await fn(over(connection));
			await raw(connection, "COMMIT");
			return result;
		} catch (error) {
			await raw(connection, "ROLLBACK").catch(() => void 0);
			throw error;
		}
	}) : db.transaction().execute((transaction) => fn(over(transaction)))
});
//#endregion
exports.kyselyExecutor = kyselyExecutor;
