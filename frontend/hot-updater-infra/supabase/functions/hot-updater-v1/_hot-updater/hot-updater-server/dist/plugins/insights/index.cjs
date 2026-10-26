var _hot_updater_plugin_insights_server = require("@hot-updater/plugin-insights/server");
Object.keys(_hot_updater_plugin_insights_server).forEach(function(k) {
	if (k !== "default" && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function() {
			return _hot_updater_plugin_insights_server[k];
		}
	});
});
