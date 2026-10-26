const require_official = require("../plugins/official.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/assembly/clientPlugins.ts
const EXPORT_NAME = /^[A-Za-z_$][\w$]*$/u;
/**
* Names app code cannot import as they are: reserved words, and the names
* the printed app code declares itself.
*/
const UNAVAILABLE_NAMES = /* @__PURE__ */ new Set([
	"App",
	"HotUpdater",
	"arguments",
	"await",
	"break",
	"case",
	"catch",
	"class",
	"const",
	"continue",
	"debugger",
	"default",
	"delete",
	"do",
	"else",
	"enum",
	"eval",
	"export",
	"extends",
	"false",
	"finally",
	"for",
	"function",
	"if",
	"implements",
	"import",
	"in",
	"instanceof",
	"interface",
	"let",
	"new",
	"null",
	"package",
	"private",
	"protected",
	"public",
	"return",
	"static",
	"super",
	"switch",
	"this",
	"throw",
	"true",
	"try",
	"typeof",
	"var",
	"void",
	"while",
	"with",
	"yield"
]);
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
/**
* The client plugins an app adds for the plugins, each once, in plugin
* order: what init prints in `HotUpdater.init`'s `plugins`. A malformed one,
* or one name from two modules, throws `HotUpdaterConfigError`.
*/
const clientPluginsOf = (plugins) => {
	if (!Array.isArray(plugins)) throw new _hot_updater_plugin_core.HotUpdaterConfigError("plugins must be an array of plugins.");
	const found = [];
	plugins.forEach((plugin, position) => require_official.checkReservedId(plugin, `plugins[${position}]`));
	for (const plugin of plugins) {
		if (!isRecord(plugin) || !isRecord(plugin.cli)) continue;
		const value = plugin.cli.clientPlugin;
		if (value === void 0) continue;
		const id = String(plugin.id);
		if (!isRecord(value) || typeof value.module !== "string" || value.module === "" || typeof value.name !== "string" || !EXPORT_NAME.test(value.name) || UNAVAILABLE_NAMES.has(value.name)) throw new _hot_updater_plugin_core.HotUpdaterConfigError(`Plugin "${id}" cli.clientPlugin needs a module and an export name the app can import: an identifier other than a reserved word, App, or HotUpdater.`);
		const { module, name } = value;
		const named = found.find((entry) => entry.name === name);
		if (named === void 0) found.push({
			module,
			name
		});
		else if (named.module !== module) throw new _hot_updater_plugin_core.HotUpdaterConfigError(`Plugin "${id}" names the client plugin "${name}" from ${module}, but another plugin names it from ${named.module}.`);
	}
	return found;
};
//#endregion
exports.clientPluginsOf = clientPluginsOf;
