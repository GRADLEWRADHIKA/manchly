var _hot_updater_plugin_api_keys_server = require("@hot-updater/plugin-api-keys/server");
Object.keys(_hot_updater_plugin_api_keys_server).forEach(function(k) {
	if (k !== "default" && !Object.prototype.hasOwnProperty.call(exports, k)) Object.defineProperty(exports, k, {
		enumerable: true,
		get: function() {
			return _hot_updater_plugin_api_keys_server[k];
		}
	});
});
