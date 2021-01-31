'use strict';

const sp = require('sudo-prompt');
const cp = require('child_process');
const fs = require('fs');

const log = require('./logger');
const Store = require('electron-store');
const store = new Store({ cwd: path.join(__dirname, "..", "..", "runtime") });

function chmod(path, mode, error_callback, result_callback) {
	// fs.access(path, fs.constants.X_OK, (err) => {
	// 	if (err) {
	// 		error_callback(err);
	// 	} else {
		log.log_debug(
			"verbose",
			{
				"event_level": "verbose",
				"event_category": "exec",
				"event_action": "chmod",
				"event_label": "",
				"event_value": ""
			},
			store.get("settings.opt_in_debug")
		);

			fs.chmod(path, mode, (err2) => {
				if (err2) {
					log.log_debug(
						"error",
						{
							"event_level": "error",
							"event_category": "exec",
							"event_action": "chmod",
							"event_label": "",
							"event_value": JSON.stringify(err2)
						},
						store.get("settings.opt_in_debug")
					);
					error_callback(err2);
				} else {
					result_callback();
				}
			});
	// 	}
	// });
}

function sudo(command, options, error_callback, result_callback) {
	log.log_debug(
		"verbose",
		{
			"event_level": "verbose",
			"event_category": "exec",
			"event_action": "sudo",
			"event_label": "",
			"event_value": ""
		},
		store.get("settings.opt_in_debug")
	);

	sp.exec(
		command,
		options,
		function (error, stdout, stderr) {
			if (error) {
				log.log_debug(
					"error",
					{
						"event_level": "error",
						"event_category": "exec",
						"event_action": "sudo",
						"event_label": "",
						"event_value": JSON.stringify(error)
					},
					store.get("settings.opt_in_debug")
				);

				error_callback(error, stdout, stderr);
			} else {
				result_callback(stdout, stderr);
			}
		}
	);
}

function exec(file, parameters, error_callback, result_callback, unquoteFile) {
	log.log_debug(
		"verbose",
		{
			"event_level": "verbose",
			"event_category": "exec",
			"event_action": "exec",
			"event_label": "",
			"event_value": ""
		},
		store.get("settings.opt_in_debug")
	);

	//this should do a UAC prompt
	//let cmd = 'cmd.exe /c "' + file + '"';
	let cmd = '"' + file + '"';
	if (unquoteFile != undefined && unquoteFile) {
		cmd = file;
	}

	$.each(parameters, function(i,v) {
		cmd = cmd + ' "' + v + '"';
	});



	//console.warn("Executing [" + cmd + "]");

	cp.exec(
		cmd,
		parameters,
		function (error, stdout, stderr) {
			if (error) {
				log.log_debug(
					"error",
					{
						"event_level": "error",
						"event_category": "exec",
						"event_action": "exec",
						"event_label": "",
						"event_value": JSON.stringify(error)
					},
					store.get("settings.opt_in_debug")
				);

				error_callback(error, stdout, stderr);
			} else {
				result_callback(stdout, stderr);
			}
		}
	);
}

function batch(file, parameters) {
	log.log_debug(
		"verbose",
		{
			"event_level": "verbose",
			"event_category": "exec",
			"event_action": "batch",
			"event_label": "",
			"event_value": ""
		},
		store.get("settings.opt_in_debug")
	);

	let params = ['/c', file];
	$.each(parameters, function(k,v) {
		//params.push(v.replace(/\s/g, "+"));
		params.push(v)
	});
	//console.log(params);

	return cp.spawn('cmd.exe', params);
}

function execBat(file, parameters, error_callback, result_callback) {
	log.log_debug(
		"verbose",
		{
			"event_level": "verbose",
			"event_category": "exec",
			"event_action": "execBat",
			"event_label": "",
			"event_value": ""
		},
		store.get("settings.opt_in_debug")
	);

	let cmd = '"' + file + '"';
	$.each(parameters, function(i,v) {
		cmd = cmd + ' "' + v.replace(/\s/g, "+") + '"';
	});

	//console.warn("Executing [" + cmd + "]");

	cp.execFile(
		cmd,
		parameters,
		function (error, stdout, stderr) {
			if (error) {
				log.log_debug(
					"error",
					{
						"event_level": "error",
						"event_category": "exec",
						"event_action": "execBat",
						"event_label": "",
						"event_value": JSON.stringify(error)
					},
					store.get("settings.opt_in_debug")
				);

				error_callback(error, stdout, stderr);
			} else {
				result_callback(stdout, stderr);
			}
		}
	);
}

function execFile(file, parameters, error_callback, result_callback) {
	log.log_debug(
		"verbose",
		{
			"event_level": "verbose",
			"event_category": "exec",
			"event_action": "execFile",
			"event_label": "",
			"event_value": ""
		},
		store.get("settings.opt_in_debug")
	);

	cp.execFile(
		file,
		parameters,
		function (error, stdout, stderr) {
			if (error) {
				log.log_debug(
					"error",
					{
						"event_level": "error",
						"event_category": "exec",
						"event_action": "execFile",
						"event_label": "",
						"event_value": JSON.stringify(error)
					},
					store.get("settings.opt_in_debug")
				);

				error_callback(error, stdout, stderr);
			} else {
				result_callback(stdout, stderr);
			}
		}
	);
}

function spawn(file, parameters, error_callback, result_callback) {
	log.log_debug(
		"verbose",
		{
			"event_level": "verbose",
			"event_category": "exec",
			"event_action": "spawn",
			"event_label": "",
			"event_value": ""
		},
		store.get("settings.opt_in_debug")
	);

	// cp.spawn(
	// 	file,
	// 	parameters,
	// 	function (error, stdout, stderr) {
	// 		if (error)
	// 			error_callback(error, stdout, stderr);
	// 		else
	// 			result_callback(stdout, stderr);
	// 	}
	// );
}

module.exports = { chmod, sudo, exec, batch, execBat, execFile, spawn };
