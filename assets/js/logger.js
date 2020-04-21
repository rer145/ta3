const el = require('electron-log');
const {is} = require('electron-util');
const cla = require('./cla');
const axios = require('axios').default;

const Store = require('electron-store');
const store = new Store();

const opt_in_base_url = is.development ? "http://localhost:81/" : "http://www.rsquaredsolutions.xyz/ta3/api/";

const analysis = el.create('analysis');
analysis.transports.file.fileName = "analysis.log";

const dbg = el.create('debug');
dbg.transports.file.fileName = "debug.log";

function log_analysis(payload, optin) {
	analysis.info(JSON.stringify(payload, null, 0));

	if (optin) {
		let full_data = {
			"debug": get_debug_info(),
			"data": payload
		};
		full_data["data"]["analysis"]["analysis_date"] = new Date();
		console.warn(full_data);

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
	let payload_min = JSON.stringify(payload, null, 0);
	switch (level) {
		case "info":
			dbg.info(payload_min);
			break;
		case "warn":
			dbg.warn(payload_min);
			break;
		case "error":
			dbg.error(payload_min);
			break;
		case "verbose":
			dbg.verbose(payload_min);
			break;
		case "debug":
			dbg.debug(payload_min);
			break;
		default:
			dbg.info(payload_min);
			break;
	}

	if (optin) {
		let full_data = {
			"debug": get_debug_info(),
			"data": payload
		};
		full_data["data"]["event_date"] = new Date();
		console.warn(full_data);

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
		"locale_country_code": store.get("system.locale_country_code"),
		"entry_mode": store.get("settings.entry_mode"),
		"arguments": JSON.stringify(cla.options)
	};
}

module.exports = {
	log_analysis,
	log_debug
};