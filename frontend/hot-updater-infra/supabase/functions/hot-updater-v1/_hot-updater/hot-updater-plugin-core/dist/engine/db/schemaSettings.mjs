import { SETTINGS_TABLE, readSettings } from "../database/fence.mjs";
//#region src/engine/db/schemaSettings.ts
const storedSettings = async (adapter, keys) => {
	const rows = await readSettings(adapter, keys);
	return new Map(keys.map((key, position) => [key, rows[position] ?? null]));
};
/** Writes the settings rows after every table exists. */
const writeSchemaSettings = async (adapter, adapterName, settings) => {
	const stored = await storedSettings(adapter, Object.keys(settings));
	const ops = Object.entries(settings).flatMap(([key, value]) => {
		const row = stored.get(key);
		if (row === null || row === void 0) return [{
			type: "insert",
			table: SETTINGS_TABLE,
			row: {
				key,
				value,
				_v: 0
			}
		}];
		if (row.value === value) return [];
		return [{
			type: "patch",
			table: SETTINGS_TABLE,
			key: [key],
			set: { value },
			guard: { v: Number(row._v) },
			previous: row
		}];
	});
	if (ops.length === 0) return;
	if (!(await adapter.write(ops)).ok) throw new Error(`${adapterName}: the schema settings changed during the migration; run it again.`);
};
/** Creates or updates every table, then writes the settings rows last. */
const migrateSchema = async (adapter, adapterName, tables, settings) => {
	if (adapter.migrations === void 0) throw new Error(`${adapterName} creates its tables with its own tooling; write only the settings rows.`);
	await adapter.migrations.apply([...tables, SETTINGS_TABLE]);
	await writeSchemaSettings(adapter, adapterName, settings);
};
//#endregion
export { migrateSchema, writeSchemaSettings };
