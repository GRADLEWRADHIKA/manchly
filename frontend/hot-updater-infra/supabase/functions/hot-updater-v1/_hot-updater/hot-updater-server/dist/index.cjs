Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_version = require("./version.cjs");
const require_handlerVersionRoutes = require("./handlerVersionRoutes.cjs");
const require_createHotUpdaterCore = require("./createHotUpdaterCore.cjs");
const require_node = require("./node.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
exports.HOT_UPDATER_INFRASTRUCTURE_GENERATION = require_handlerVersionRoutes.HOT_UPDATER_INFRASTRUCTURE_GENERATION;
exports.HOT_UPDATER_SERVER_VERSION = require_version.HOT_UPDATER_SERVER_VERSION;
Object.defineProperty(exports, "HotUpdaterConfigError", {
	enumerable: true,
	get: function() {
		return _hot_updater_plugin_core.HotUpdaterConfigError;
	}
});
exports.createHotUpdater = require_createHotUpdaterCore.createHotUpdater;
exports.toNodeHandler = require_node.toNodeHandler;
