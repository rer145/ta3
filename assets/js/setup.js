'use strict';

window.$ = window.jQuery = require('jquery');
window.Tether = require('tether');
window.Bootstrap = require('bootstrap');

const path = require('path');
const {is} = require('electron-util');
const https = require('https');
const fs = require('fs');
const async = require('async');
const axios = require('axios').default;

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
	reset_progress("setup-assets");
	reset_progress("setup-r");
	reset_progress("setup-packages");
}

function start() {
	reset();

	return new Promise(function(resolve, reject) {
		if (is.windows || is.macos) {
			setTimeout(function() {
				install_assets()
					.then(function(response) {
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
					}, function(error) {
						log.log_debug(
							"error",
							{
								"event_level": "error",
								"event_category": "exception",
								"event_action": "setup.start",
								"event_label": "install_assets",
								"event_value": JSON.stringify(error)
							},
							store.get("settings.opt_in_debug")
						);
						reject("Asset download error:", error);
					});
			});
		}
		else {
			resolve("Operating System not compatible.");
		}
	});
}

function download_file(url, dest) {
	return new Promise(function(resolve, reject) {
		console.log(`Downloading ${url} to ${dest}`);

		let file = fs.createWriteStream(dest);
		let request = https.get(url, function(response) {
			response.pipe(file);
			file.on('finish', function() {
				file.close();
				resolve();
			});
		}).on('error', function(error) {
			console.error("Download error:", error);
			fs.unlink(dest);
			reject(error);
		});
	});
}

function install_assets(partial_items) {
	return new Promise(function(resolve, reject) {
		//start_progress("setup-assets");

		let t0 = now();

		let base_url = 'https://ta3info.com/app-assets/latest/';
		if (is.development) {
			// base_url
		}

		// let urls = [
		// 	'analysis/install.R',
		// 	'analysis/ta3.R',
		// 	'analysis/TA3_Case_Scores.Rda',
		// 	'analysis/TA3BUM.Rda',
		// 	'analysis/TA3OUM.Rda',
		// 	'database/db.min.json',
		// 	'pdf/collection-form.pdf',
		// 	'pdf/trait-manual.pdf',
		// 	'pdf/user-guide.pdf'
		// ];

		let latest_versions = {};
		let latest_url = 'https://ta3info.com/app-assets/latest.json';
		if (is.development) {
			// latest_url
		}

		axios.get(latest_url)
			.then(function(response) {
				latest_versions = response.data;
			})
			.then(function() {
				let items = [];
				if (partial_items != null && partial_items != undefined) {
					items = partial_items;
				} else {
					let versions = store.get("versions");
					items.push({ "versions_key": "versions.analysis.install", "path": "analysis/" + versions.analysis.install.file, "latest": latest_versions.analysis.install.version });
					items.push({ "versions_key": "versions.analysis.analysis", "path": "analysis/" + versions.analysis.analysis.file, "latest": latest_versions.analysis.analysis.version });
					items.push({ "versions_key": "versions.analysis.case_scores", "path": "analysis/" + versions.analysis.case_scores.file, "latest": latest_versions.analysis.case_scores.version });
					items.push({ "versions_key": "versions.analysis.bum", "path": "analysis/" + versions.analysis.bum.file, "latest": latest_versions.analysis.bum.version });
					items.push({ "versions_key": "versions.analysis.oum", "path": "analysis/" + versions.analysis.oum.file, "latest": latest_versions.analysis.oum.version });
					items.push({ "versions_key": "versions.pdf.trait_manual", "path": "pdf/" + versions.pdf.trait_manual.file, "latest": latest_versions.pdf.trait_manual.version });
					items.push({ "versions_key": "versions.pdf.collection_form", "path": "pdf/" + versions.pdf.collection_form.file, "latest": latest_versions.pdf.collection_form.version });
					items.push({ "versions_key": "versions.pdf.user_guide", "path": "pdf/" + versions.pdf.user_guide.file, "latest": latest_versions.pdf.user_guide.version });
					items.push({ "versions_key": "versions.database", "path": "database/db.min.json", "latest": latest_versions.database });
				}

				let counter = 1;
				update_progress("setup-assets", counter, items.length);

				let has_error = false;
				let last_error = null;
				async.eachSeries(items, function(u, cb) {
					download_file(
						base_url + u.path,
						path.join(store.get("user.assets_path"), u.path)
					).then(
						function(response) {
							update_progress("setup-assets", counter, items.length);
							counter++;
							if (u.versions_key == "versions.database")
								store.set(u.versions_key, u.latest);
							else
								store.set(u.versions_key + ".version", u.latest);

							return cb();
						},
						function(error) {
							console.error(error);
							has_error = true;
							last_error = error;
						}
					);
				}, function() {
					let t1 = now();
					log.log_debug(
						"info",
						{
							"event_level": "info",
							"event_category": "performance",
							"event_action": "install_assets",
							"event_label": "",
							"event_value": (t1-t0)
						},
						store.get("settings.opt_in_debug")
					);

					if (has_error)
						reject(last_error);
					else {
						end_progress("setup-assets", 0, "Assets downloaded successfully.");
						resolve();
					}
				});
			});
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

function update_progress(id, idx, total) {
	let percentage = Math.round((idx/total)*100, 1);

	$("#" + id + " .setup-item-status").html(`${idx} of ${total}`);
	$("#" + id + " .setup-item-package").html("");
	$("#" + id + " .progress-bar")
		.attr("aria-valuenow", percentage)
		.css("width", percentage + "%")
		.addClass("progress-bar-warning")
		.addClass("progress-bar-striped")
		.addClass("active");
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
	install_assets,
	install_rportable,
	install_packages
};
