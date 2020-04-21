'use strict';

window.$ = window.jQuery = require('jquery');
window.Tether = require('tether');
window.Bootstrap = require('bootstrap');

const path = require('path');
const {is} = require('electron-util');
const Store = require('electron-store');
const store = new Store();

const now = require('performance-now');
const exec = require('./exec');
const log = require('./logger');

let scripts_path = path.join(store.get("app.resources_path"), "setup");

// returns if the installation is completed
function check_installation(forceInstall) {
	reset();

	if (is.windows || is.macos) {
		if (forceInstall)
			return false;
		else
			return !store.get("settings.first_run");
	}

	return true;
}

function reset() {
	reset_progress("setup-r");
	reset_progress("setup-packages");
}

function start() {
	reset();
	
	return new Promise(function(resolve, reject) {
		if (is.windows || is.macos) {
			setTimeout(function() {
				install_rportable()
					.then(function(response) {
						install_packages()
							.then(function(response) {
								resolve();
							}, function(error) {
								log.log_debug(
									"error", 
									{
										"event_level": "error",
										"event_category": "exception",
										"event_action": "setup.start",
										"event_label": "install_packages",
										"event_value": JSON.stringify(error)
									}, 
									store.get("settings.opt_in_debug")
								);
								reject("Packages install error:", error);
							});
					}, function(error) {
						log.log_debug(
							"error", 
							{
								"event_level": "error",
								"event_category": "exception",
								"event_action": "setup.start",
								"event_label": "install_rportable",
								"event_value": JSON.stringify(error)
							}, 
							store.get("settings.opt_in_debug")
						);
						reject("R install error:", error);
					});
					
			});
		}
		else {
			resolve("Operating System not compatible.");
		}
	});
}

function install_rportable() {
	return new Promise(function(resolve, reject) {
		let t0 = now();

		let batch_file = path.join(scripts_path, "install_rportable.bat");
		console.log("Installing R-Portable:", batch_file);
		start_progress("setup-r");

		if (is.macos) {
			let source_root = path.join(store.get("app.resources_path"), "R-Portable");
			let dest_root = path.join(store.get("user.userdata_path"), "R-Portable");

			if (is.development) {
				source_root = path.join(store.get("app.resources_path"), "R-Portable", "R-Portable-Mac");
			}

			batch_file = 'cp -a "' + source_root + '/." "' + dest_root + '/"';
		}

		if (is.windows || is.macos) {
			console.log("Executing:", batch_file);
			exec.exec(
				batch_file, 
				[], 
				function(error, stdout, stderr) {
					log.log_debug(
						"error", 
						{
							"event_level": "error",
							"event_category": "exception",
							"event_action": "install_rportable",
							"event_label": JSON.stringify(batch_file),
							"event_value": JSON.stringify(error)
						}, 
						store.get("settings.opt_in_debug")
					);

					console.error(error);
					end_progress("setup-r", -1, stderr);
					reject(stderr);
				}, 
				function(stdout, stderr) {
					let t1 = now();
					log.log_debug(
						"info", 
						{
							"event_level": "info",
							"event_category": "performance",
							"event_action": "install_rportable",
							"event_label": "",
							"event_value": (t1-t0)
						}, 
						store.get("settings.opt_in_debug")
					);

					console.log(stdout);
					end_progress("setup-r", 0, "R-Portable (v3.6.2) installation was successful.");
					resolve();
				},
				is.macos);
		}
	});
}

function install_packages() {
	return new Promise(function(resolve, reject) {
		let t0 = now();

		let batch_file = path.join(scripts_path, "install_packages.bat");
		console.log("Installing Packages:", batch_file);
		start_progress("setup-packages");
		
		var params = [
			store.get("app.rscript_path"),
			store.get("user.packages_path"),
			store.get("app.r_analysis_path")
		];

		if (is.macos) {
			exec.chmod(
				store.get("app.rscript_path"), 
				0o777, 
				function(error) {
					log.log_debug(
						"error", 
						{
							"event_level": "error",
							"event_category": "exception",
							"event_action": "install_packages",
							"event_label": "chmod",
							"event_value": JSON.stringify(error)
						}, 
						store.get("settings.opt_in_debug")
					);
					console.error(error);
					end_progress("setup-packages", -1, error);
					reject(error);
				},
				function() {
					console.log("Set execution permissions on RScript successfully.");
				}
			);

			batch_file = '"' + store.get("app.rscript_path") + '" "' + path.join(store.get("app.r_analysis_path"), "install.R") + '" "' + store.get("user.packages_path") + '"';
			params = [];
		}

		if (is.windows || is.macos) {
			console.log("Executing:", batch_file);
			exec.exec(
				batch_file, 
				params, 
				function(error, stdout, stderr) {
					// log.dbg.error(`Error installing packages: ${error}`);
					// log.dbg.debug(batch_file);
					// log.dbg.debug(params);
					log.log_debug(
						"error", 
						{
							"event_level": "error",
							"event_category": "exception",
							"event_action": "install_packages",
							"event_label": { "batch_file": batch_file, "params": params },
							"event_value": JSON.stringify(error)
						}, 
						store.get("settings.opt_in_debug")
					);
					console.error(error);
					end_progress("setup-packages", -1, stderr);
					reject(stderr);
				}, 
				function(stdout, stderr) {
					let t1 = now();
					log.log_debug(
						"info", 
						{
							"event_level": "info",
							"event_category": "performance",
							"event_action": "install_packages",
							"event_label": "",
							"event_value": (t1-t0)
						}, 
						store.get("settings.opt_in_debug")
					);
					console.log(stdout);
					end_progress("setup-packages", 0, "R package installation was successful.");
					resolve();
				},
				is.macos);
		}
	});
}


function reset_progress(id) {
	$("#" + id + " .setup-item-status").html("");
	$("#" + id + " .setup-item-package").html("");
		
	$("#" + id + " .progress-bar")
		.attr("aria-valuenow", 0)
		.css("width", "0%")
		.removeClass("progress-bar-warning")
		.removeClass("progress-bar-success")
		.removeClass("progress-bar-striped")
		.removeClass("active");
}

function start_progress(id) {
	$("#" + id + " .progress-bar")
		.attr("aria-valuenow", 50)
		.css("width", "50%")
		.addClass("progress-bar-warning")
		.addClass("progress-bar-striped")
		.addClass("active");
}

function end_progress(id, code, msg) {
	if (code === 0) {
		$("#" + id + " .setup-item-status").html("OK");
		
		$("#" + id + " .progress-bar")
			.attr("aria-valuenow", 100)
			.css("width", "100%")
			.removeClass("progress-bar-warning")
			.addClass("progress-bar-success")
			.removeClass("progress-bar-striped")
			.removeClass("active");
	} else {
		$("#" + id + " .setup-item-status").html("FAILED!");

		$("#" + id + " .progress-bar")
			.attr("aria-valuenow", 100)
			.css("width", "100%")
			.removeClass("progress-bar-success")
			.addClass("progress-bar-danger")
			.removeClass("progress-bar-striped")
			.removeClass("active");

		$("#" + id + " .err pre").html(msg);
		$("#" + id + " .err").show();
	}
}

module.exports = { 
	check_installation, 
	reset,
	start, 
	install_rportable, 
	install_packages
};