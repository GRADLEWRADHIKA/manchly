//#region src/engine/database/fence.ts
/**
* The settings rows migrations write, last, and the fence reads; retention
* passes keep their lease here too. Tooling that creates the tables creates
* this one with them: an ORM's schema generator, a provider's setup, and an
* access policy that names the tables a server reads.
*/
const SETTINGS_TABLE = {
	name: "private_hot_updater_settings",
	columns: [
		{
			name: "key",
			type: "string",
			nullable: false,
			maxLength: 255
		},
		{
			name: "value",
			type: "string",
			nullable: false,
			maxLength: 255
		},
		{
			name: "_v",
			type: "integer",
			nullable: false,
			default: 0
		}
	],
	key: ["key"],
	indexes: []
};
/** The engine's storage-layout generation; it changes only with a migration. */
const ENGINE_SCHEMA_KEY = "schema.engine";
const CORE_SCHEMA_KEY = "schema.core";
const stored = ({ key, expected, found }) => `"${key}" is ${found === null ? "missing" : `"${found}"`}; expected "${expected}"`;
const settingMessage = (adapterName, { key, expected, found }) => `Hot Updater schema setting "${key}" for ${adapterName} is ${found === null ? "missing" : `"${found}"`}; expected "${expected}". Run \`hot-updater db migrate\`.`;
/** The plugin a `schema.<id>` setting belongs to; undefined for core's and the engine's. */
const pluginOf = ({ key }) => key.startsWith("schema.") && key !== "schema.engine" && key !== CORE_SCHEMA_KEY ? key.slice(7) : void 0;
const listed = (items) => items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
/** How to create plugins' tables when the fence was given no fix. */
const PLUGIN_TABLES_FIX = "Run `hot-updater db migrate`. A managed server runs only its provider's plugins, and rerunning `hot-updater init --provider <provider>` applies the provider's migrations. Run `hot-updater db` commands in the server's project: they load the server file named on the command line, or src/hotUpdater.* or src/db.*, and don't read hot-updater.config.ts.";
const pluginsMessage = (adapterName, plugins, settings, fix) => `The tables of ${plugins.length === 1 ? "plugin" : "plugins"} ${listed(plugins.map((id) => `"${id}"`))} are not migrated on ${adapterName}: schema ${settings.length === 1 ? "setting" : "settings"} ${settings.map(stored).join(", and ")}. ${fix}`;
/** The database needs `hot-updater db migrate`, or a new database; the handler answers 503. */
var HotUpdaterSchemaMigrationRequiredError = class extends Error {
	adapterName;
	currentVersion;
	setting;
	/** Every setting the fence found missing or different; `setting` is the first. */
	settings;
	/**
	* The ids of the plugins whose `schema.<id>` setting is among them: the
	* plugins whose tables a migration has yet to create or change.
	*/
	plugins;
	constructor(adapterName, currentVersion, setting, options) {
		const settings = options?.settings ?? (setting === void 0 ? [] : [setting]);
		const plugins = settings.flatMap((mismatch) => pluginOf(mismatch) ?? []);
		super(setting === void 0 ? currentVersion === void 0 ? `Hot Updater database schema is not initialized for ${adapterName}. Run \`hot-updater db migrate\` before using this adapter.` : `Hot Updater v1 cannot migrate schema ${currentVersion} in place. Create a new empty database and run \`hot-updater db migrate\`.` : plugins.length > 0 && plugins.length === settings.length ? pluginsMessage(adapterName, plugins, settings, options?.fix ?? PLUGIN_TABLES_FIX) : settingMessage(adapterName, setting), options?.cause === void 0 ? void 0 : { cause: options.cause });
		this.adapterName = adapterName;
		this.currentVersion = currentVersion;
		this.setting = setting;
		this.name = "HotUpdaterSchemaMigrationRequiredError";
		this.settings = settings;
		this.plugins = plugins;
	}
};
/** Driver codes for a table or column the database lacks. */
const MISSING_SCHEMA_CODES = /* @__PURE__ */ new Set([
	"42P01",
	"42703",
	"ER_NO_SUCH_TABLE",
	"ER_BAD_FIELD_ERROR"
]);
const MISSING_SCHEMA_MESSAGE = /no such (?:table|column)|(?:relation|column) .+ does not exist|table .+ doesn't exist|unknown column/iu;
/**
* Whether a read failed because a table or column is missing, so the
* database needs migrations. ORMs may wrap the driver's error in `cause`.
*/
const isMissingSchemaError = (error) => {
	for (let depth = 0; error instanceof Object && depth < 8; depth += 1) {
		const { code, message, cause } = error;
		if (MISSING_SCHEMA_CODES.has(String(code)) || typeof message === "string" && MISSING_SCHEMA_MESSAGE.test(message)) return true;
		error = cause;
	}
	return false;
};
const readSettings = (adapter, keys) => adapter.get(SETTINGS_TABLE, keys.map((key) => [key]));
/**
* Throws unless every expected setting is stored with its value: one batch
* read. The error lists every setting missing or different; `fix` says how
* to create the plugins' tables on this database.
*/
const checkSchemaFence = async (adapter, adapterName, expected, fix) => {
	const keys = Object.keys(expected);
	let rows;
	try {
		rows = await readSettings(adapter, keys);
	} catch (cause) {
		if (!isMissingSchemaError(cause)) throw cause;
		throw new HotUpdaterSchemaMigrationRequiredError(adapterName, void 0, {
			key: ENGINE_SCHEMA_KEY,
			expected: "1",
			found: null
		}, { cause });
	}
	const settings = keys.flatMap((key, position) => {
		const found = rows[position]?.value;
		return found === expected[key] ? [] : [{
			key,
			expected: expected[key],
			found: typeof found === "string" ? found : null
		}];
	});
	const [first] = settings;
	if (first !== void 0) throw new HotUpdaterSchemaMigrationRequiredError(adapterName, void 0, first, {
		settings,
		...fix === void 0 ? {} : { fix }
	});
};
/** The database name a fenced adapter carries, so a server can fence its plugins' rows too. */
const FENCED = Symbol.for("@hot-updater/server/schema-fence");
/** The database name an adapter behind the schema fence reports under. */
const fencedName = (adapter) => adapter[FENCED];
/**
* The adapter behind the schema fence: a process's first read or write
* checks the settings first. Success is kept; a failure is checked again on
* the next call.
*/
const withSchemaFence = (adapter, adapterName, expected, fix) => {
	let ready;
	const fence = () => {
		ready ??= checkSchemaFence(adapter, adapterName, expected, fix).catch((error) => {
			ready = void 0;
			throw error;
		});
		return ready;
	};
	return {
		...adapter,
		[FENCED]: adapterName,
		get: (table, keys) => fence().then(() => adapter.get(table, keys)),
		query: (table, request) => fence().then(() => adapter.query(table, request)),
		write: (ops) => fence().then(() => adapter.write(ops)),
		...adapter.prune && { prune: (table, before, limit) => fence().then(() => adapter.prune(table, before, limit)) }
	};
};
//#endregion
export { ENGINE_SCHEMA_KEY, HotUpdaterSchemaMigrationRequiredError, SETTINGS_TABLE, checkSchemaFence, fencedName, isMissingSchemaError, readSettings, withSchemaFence };
