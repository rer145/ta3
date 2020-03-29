'use strict';

var sp = require('sudo-prompt');
var cp = require('child_process');

function sudo(command, options, error_callback, result_callback) {
	sp.exec(
		command, 
		options, 
		function (error, stdout, stderr) {
			if (error)
				error_callback(error, stdout, stderr);
			else
				result_callback(stdout, stderr);
		}
	);
}

function exec(file, parameters, error_callback, result_callback) {
	//this should do a UAC prompt
	//let cmd = 'cmd.exe /c "' + file + '"';
	let cmd = '"' + file + '"';
	$.each(parameters, function(i,v) {
		cmd = cmd + ' "' + v + '"';
	});

	console.warn("Executing [" + cmd + "]");

	cp.exec(
		cmd,
		parameters,
		function (error, stdout, stderr) {
			if (error)
				error_callback(error, stdout, stderr);
			else
				result_callback(stdout, stderr);
		}
	);
}

function execCmd(file, parameters, error_callback, result_callback) {
	//this should do a UAC prompt
	//let cmd = 'cmd.exe /c "' + file + '"';
	let cmd = 'cmd.exe /c "' + file.replace(/\\/g, "\\\\") + '"';
	$.each(parameters, function(i,v) {
		cmd = cmd + ' "' + v.replace(/\\/g, "\\\\") + '"';
	});

	console.warn("Executing [" + cmd + "]");

	cp.exec(
		cmd,
		parameters,
		function (error, stdout, stderr) {
			if (error)
				error_callback(error, stdout, stderr);
			else
				result_callback(stdout, stderr);
		}
	);
}

function batch(file, parameters) {
	let params = ['/c', file];
	$.each(parameters, function(k,v) {
		//params.push(v.replace(/\s/g, "+"));
		params.push(v)
	});
	console.log(params);

	return cp.spawn('cmd.exe', params);
}

function execBat(file, parameters, error_callback, result_callback) {
	let cmd = '"' + file + '"';
	$.each(parameters, function(i,v) {
		cmd = cmd + ' "' + v.replace(/\s/g, "+") + '"';
	});

	console.warn("Executing [" + cmd + "]");

	cp.execFile(
		cmd,
		parameters,
		function (error, stdout, stderr) {
			if (error)
				error_callback(error, stdout, stderr);
			else
				result_callback(stdout, stderr);
		}
	);
}

function execFile(file, parameters, error_callback, result_callback) {
	cp.execFile(
		file, 
		parameters, 
		function (error, stdout, stderr) {
			if (error)
				error_callback(error, stdout, stderr);
			else
				result_callback(stdout, stderr);
		}
	);
}

module.exports = { sudo, exec, execCmd, batch, execBat, execFile };