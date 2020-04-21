const el = require('electron-log');
const {is} = require('electron-util');
const axios = require('axios').default;

const Store = require('electron-store');
const store = new Store();

const opt_in_base_url = is.development ? "http://localhost:81/" : "http://www.rsquaredsolutions.xyz/ta3/api/";

const analysis = el.create('analysis');
analysis.transports.file.fileName = "analysis.log";

const dbg = el.create('debug');
dbg.transports.file.fileName = "debug.log";

function log_analysis(payload, optin) {
	analysis.info(payload);

	if (optin) {
		let full_data = {
			"debug": get_debug_info(),
			"data": payload
		};

		let url = opt_in_base_url + 'api.php?method=log_analysis';
		axios.post(url, full_data)
			.then(function(response) {
				console.log("ajax response", response);
			}).catch(function(error) {
				console.error(error);	
			});
	}
}

function log_debug(level, payload, optin) {
	switch (level) {
		case "info":
			dbg.info(payload);
			break;
		case "warn":
			dbg.warn(payload);
			break;
		case "error":
			dbg.error(payload);
			break;
		case "verbose":
			dbg.verbose(payload);
			break;
		case "debug":
			dbg.debug(payload);
			break;
		default:
			dbg.info(payload);
			break;
	}

	if (optin) {
		let full_data = {
			"debug": get_debug_info(),
			"data": payload
		};

		let url = opt_in_base_url + 'api.php?method=log_debug';
		axios.post(url, full_data)
			.then(function(response) {
				console.log("ajax response", response);
			}).catch(function(error) {
				console.error(error);	
			});
	}
}

function get_debug_info() {
	return {
		"uuid": store.get("uuid"),
		"app_version": store.get("version"),
		"r_version": store.get("system.r_portable_version"),
		"r_code_version": store.get("system.r_code_version"),
		"db_version": store.get("system.db_version"),
		"platform": store.get("system.platform"),
		"platform_release": store.get("system.platform_release"),
		"arch": store.get("system.arch"),
		"node_version": store.get("system.node_version"),
		"electron_version": store.get("system.electron_version"),
		"chrome_version": store.get("system.chrome_version"),
		"locale": store.get("system.locale"),
		"locale_country_code": store.get("system.locale_country_code")
	};
}

module.exports = {
	log_analysis,
	log_debug
};