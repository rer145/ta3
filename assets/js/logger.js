const el = require('electron-log');

const perf = el.create('performance');
perf.transports.file.fileName = "performance.log";

const analysis = el.create('analysis');
analysis.transports.file.fileName = "analysis.log";

const dbg = el.create('debug');
dbg.transports.file.fileName = "debug.log";

function send(l) {

}

function view(l) {

}

// function error(l, message) {
// 	if (store.get("settings.analytics", true)) {
// 		l.error(message);
// 	}
// }

module.exports = {
	perf,
	analysis,
	dbg,
	send,
	view,

	// error,
	// warn,
	// info,
	// verbose,
	// debug,
	// silly
};