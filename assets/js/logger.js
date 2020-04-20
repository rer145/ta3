const el = require('electron-log');
const axios = require('axios').default;


const perf = el.create('performance');
perf.transports.file.fileName = "performance.log";

const analysis = el.create('analysis');
analysis.transports.file.fileName = "analysis.log";

const dbg = el.create('debug');
dbg.transports.file.fileName = "debug.log";

function send(l) {

}

function send_analysis(data) {
	axios.post('http://localhost:81/api.php?method=log', data)
		.then(function(response) {
			console.log("ajax response", response);
		}).catch(function(error) {
			console.error(error);	
		});
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

	send_analysis,

	// error,
	// warn,
	// info,
	// verbose,
	// debug,
	// silly
};