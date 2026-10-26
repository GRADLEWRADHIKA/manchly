import { SETTINGS_TABLE, quoteSql } from "@hot-updater/plugin-core";
//#region src/adapters/prismaExecutor.ts
/**
* Prisma reports a raw query's database error as P2010 with the database's
* code in `meta.code`, and a failed transaction as P2034. The error thrown on
* carries that code, as the SQL core classifies it, with Prisma's as `cause`.
*/
const withDatabaseCode = (dialect, error) => {
	const { code, meta } = error ?? {};
	const database = code === "P2034" ? "40001" : meta?.code === void 0 ? void 0 : String(meta.code);
	if (database === void 0) return error;
	return Object.assign(new Error(String(meta?.message ?? error.message), { cause: error }), { code: dialect === "sqlite" ? `SQLITE:${database}` : database });
};
/** MySQL's ASCII keys are `VarBinary` in Prisma's schema, and read back as bytes. */
const decoder = new TextDecoder();
const decodeRow = (row) => {
	for (const [column, value] of Object.entries(row)) if (value instanceof Uint8Array) row[column] = decoder.decode(value);
	return row;
};
const over = (dialect, client) => ({ async execute({ sql, params }) {
	try {
		if (/^\s*SELECT\b/iu.test(sql)) return {
			rows: (await client.$queryRawUnsafe(sql, ...params)).map(decodeRow),
			changes: 0
		};
		return {
			rows: [],
			changes: Number(await client.$executeRawUnsafe(sql, ...params))
		};
	} catch (error) {
		throw withDatabaseCode(dialect, error);
	}
} });
/** Taking the write lock first makes a SQLite transaction behave as BEGIN IMMEDIATE. */
const writeLock = (dialect) => `UPDATE ${quoteSql(dialect, SETTINGS_TABLE.name)} SET ${quoteSql(dialect, "_v")} = ${quoteSql(dialect, "_v")} WHERE 0 = 1`;
/**
* The SQL core's executor over a Prisma client, through raw queries and
* interactive transactions. A SQLite transaction takes the write lock with
* its first statement, as BEGIN IMMEDIATE would.
*/
const prismaExecutor = (client, dialect) => ({
	dialect,
	...over(dialect, client),
	async transaction(fn) {
		try {
			return await client.$transaction(async (tx) => {
				const connection = over(dialect, tx);
				if (dialect === "sqlite") await connection.execute({
					sql: writeLock(dialect),
					params: []
				});
				return fn(connection);
			}, {
				maxWait: 1e4,
				timeout: 3e4
			});
		} catch (error) {
			throw withDatabaseCode(dialect, error);
		}
	}
});
//#endregion
export { prismaExecutor };
