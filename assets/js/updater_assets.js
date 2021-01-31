const path = require('path');
const fs = require('fs');
const semver = require('semver');

const { dialog, ipcRenderer } = require('electron');
const win = require('electron').BrowserWindow;
const { ipcMain } = require("electron");
const {is} = require('electron-util');
const axios = require('axios').default;
const https = require('https');
const async = require('async');

const now = require('performance-now');
const log = require('./logger');
const Store = require('electron-store');
const store = new Store({ cwd: path.join(__dirname, "..", "..", "runtime") });


function checkForUpdates() {
	let current_versions = store.get("versions");

	let latest_url = 'https://ta3info.com/app-assets/latest.json';
	if (is.development) {
		// latest_url
	}

	axios.get(latest_url)
		.then(function(response) {
			//console.log(response.data);
			console.log(current_versions);
			let latest_versions = response.data;

			// console.log("current", current_versions.analysis.install.version);
			// console.log("latest", latest_versions.analysis.install.version);
			// console.log("update?", semver.gt(latest_versions.analysis.install.version, current_versions.analysis.install.version));

			// HACK: figure out way to loop through
			let updates = [];
			try {
				if (semver.gt(latest_versions.analysis.install.version, current_versions.analysis.install.version) ||
					!fs.existsSync(path.join(store.get("user.assets_path"), "analysis", latest_versions.analysis.install.file)))
					updates.push({ "versions_key": "versions.analysis.install", "path": "analysis/" + latest_versions.analysis.install.file, "latest": latest_versions.analysis.install });
			} catch {
				updates.push({ "versions_key": "versions.analysis.install", "path": "analysis/" + latest_versions.analysis.install.file, "latest": latest_versions.analysis.install });
			}

			try {
				if (semver.gt(latest_versions.analysis.analysis.version, current_versions.analysis.analysis.version) ||
					!fs.existsSync(path.join(store.get("user.assets_path"), "analysis", latest_versions.analysis.analysis.file)))
					updates.push({ "versions_key": "versions.analysis.analysis", "path": "analysis/" + latest_versions.analysis.analysis.file, "latest": latest_versions.analysis.analysis });
			} catch {
				updates.push({ "versions_key": "versions.analysis.analysis", "path": "analysis/" + latest_versions.analysis.analysis.file, "latest": latest_versions.analysis.analysis });
			}

			try {
				if (semver.gt(latest_versions.analysis.case_scores.version, current_versions.analysis.case_scores.version) ||
					!fs.existsSync(path.join(store.get("user.assets_path"), "analysis", latest_versions.analysis.case_scores.file)))
					updates.push({ "versions_key": "versions.analysis.case_scores", "path": "analysis/" + latest_versions.analysis.case_scores.file, "latest": latest_versions.analysis.case_scores });
			} catch {
				updates.push({ "versions_key": "versions.analysis.case_scores", "path": "analysis/" + latest_versions.analysis.case_scores.file, "latest": latest_versions.analysis.case_scores });
			}

			try {
				if (semver.gt(latest_versions.analysis.bum.version, current_versions.analysis.bum.version) ||
					!fs.existsSync(path.join(store.get("user.assets_path"), "analysis", latest_versions.analysis.bum.file)))
					updates.push({ "versions_key": "versions.analysis.bum", "path": "analysis/" + latest_versions.analysis.bum.file, "latest": latest_versions.analysis.bum });
			} catch {
				updates.push({ "versions_key": "versions.analysis.bum", "path": "analysis/" + latest_versions.analysis.bum.file, "latest": latest_versions.analysis.bum });
			}

			try {
				if (semver.gt(latest_versions.analysis.oum.version, current_versions.analysis.oum.version) ||
					!fs.existsSync(path.join(store.get("user.assets_path"), "analysis", latest_versions.analysis.oum.file)))
					updates.push({ "versions_key": "versions.analysis.oum", "path": "analysis/" + latest_versions.analysis.oum.file, "latest": latest_versions.analysis.oum });
			} catch {
				updates.push({ "versions_key": "versions.analysis.oum", "path": "analysis/" + latest_versions.analysis.oum.file, "latest": latest_versions.analysis.oum });
			}

			try {
				if (semver.gt(latest_versions.pdf.trait_manual.version, current_versions.pdf.trait_manual.version) ||
					!fs.existsSync(path.join(store.get("user.assets_path"), "pdf", latest_versions.pdf.trait_manual.file)))
					updates.push({ "versions_key": "versions.pdf.trait_manual", "path": "pdf/" + latest_versions.pdf.trait_manual.file, "latest": latest_versions.pdf.trait_manual });
			} catch {
				updates.push({ "versions_key": "versions.pdf.trait_manual", "path": "pdf/" + latest_versions.pdf.trait_manual.file, "latest": latest_versions.pdf.trait_manual });
			}

			try {
				if (semver.gt(latest_versions.pdf.collection_form.version, current_versions.pdf.collection_form.version) ||
					!fs.existsSync(path.join(store.get("user.assets_path"), "pdf", latest_versions.pdf.collection_form.file)))
					updates.push({ "versions_key": "versions.pdf.collection_form", "path": "pdf/" + latest_versions.pdf.collection_form.file, "latest": latest_versions.pdf.collection_form });
			} catch {
				updates.push({ "versions_key": "versions.pdf.collection_form", "path": "pdf/" + latest_versions.pdf.collection_form.file, "latest": latest_versions.pdf.collection_form });
			}

			try {
				if (semver.gt(latest_versions.pdf.user_guide.version, current_versions.pdf.user_guide.version) ||
					!fs.existsSync(path.join(store.get("user.assets_path"), "pdf", latest_versions.pdf.user_guide.file)))
					updates.push({ "versions_key": "versions.pdf.user_guide", "path": "pdf/" + latest_versions.pdf.user_guide.file, "latest": latest_versions.pdf.user_guide });
			} catch {
				updates.push({ "versions_key": "versions.pdf.user_guide", "path": "pdf/" + latest_versions.pdf.user_guide.file, "latest": latest_versions.pdf.user_guide });
			}

			try {
				if (semver.gt(latest_versions.database, current_versions.database) ||
					!fs.existsSync(path.join(store.get("user.assets_path"), "database", "db.min.json")))
					updates.push({ "versions_key": "versions.database", "path": "database/db.min.json", "latest": latest_versions.database });
			} catch {
				updates.push({ "versions_key": "versions.database", "path": "database/db.min.json", "latest": latest_versions.database });
			}


			if (updates.length > 0) {
				win.getFocusedWindow().webContents.send('asset-update-new', updates);
				return true;
			}
			return false;
		}).catch(function(error) {
			console.error(error);
			return false;
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

function downloadAndInstall(items) {
	return new Promise(function(resolve, reject) {
		let t0 = now();

		let base_url = 'https://ta3info.com/app-assets/latest/';
		if (is.development) {
			// base_url
		}

		let counter = 1;
		//update_progress("setup-assets", counter, items.length);
		win.getFocusedWindow().webContents.send('update-asset-progress', {
			"id": "setup-assets",
			"idx": counter,
			"total": items.length
		});

		let has_error = false;
		let last_error = null;
		async.eachSeries(items, function(u, cb) {
			download_file(
				base_url + u.path,
				path.join(store.get("user.assets_path"), u.path)
			).then(
				function(response) {
					//update_progress("setup-assets", counter, items.length);
					win.getFocusedWindow().webContents.send('update-asset-progress', {
						"id": "setup-assets",
						"idx": counter,
						"total": items.length
					});

					counter++;

					if (u.versions_key == "versions.database")
						store.set(u.versions_key, u.latest);
					else
						store.set(u.versions_key + ".version", u.latest.version);

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

			if (has_error) {
				log.log_debug(
					"info",
					{
						"event_level": "info",
						"event_category": "performance",
						"event_action": "update_assets",
						"event_label": "",
						"event_value": (t1-t0)
					},
					store.get("settings.opt_in_debug")
				);

				log.log_debug(
					"error",
					{
						"event_level": "error",
						"event_category": "exception",
						"event_action": "updater_assets.downloadAndInstall",
						"event_label": "update_assets",
						"event_value": JSON.stringify(last_error)
					},
					store.get("settings.opt_in_debug")
				);

				//end_progress("setup-assets", -1, last_error);
				win.getFocusedWindow().webContents.send('end-asset-progress', {
					"id": "setup-assets",
					"code": -1,
					"msg": last_error
				});
				reject(last_error);
			} else {
				log.log_debug(
					"info",
					{
						"event_level": "info",
						"event_category": "performance",
						"event_action": "update_assets",
						"event_label": "",
						"event_value": (t1-t0)
					},
					store.get("settings.opt_in_debug")
				);

				//end_progress("setup-assets", 0, "Assets downloaded successfully.");
				win.getFocusedWindow().webContents.send('end-asset-progress', {
					"id": "setup-assets",
					"code": 0,
					"msg": "Assets downloaded successfully."
				});
				resolve();
			}
		});
	});
}

ipcMain.on('check-asset-update', () => {
	if (store.get("user.assets_path")) {
		if (store.get("user.assets_path").indexOf('runtime') == -1)
			checkForUpdates();
	}
});

ipcMain.on('update-asset-install', (event, arg) => {
	log.log_debug(
		"verbose",
		{
			"event_level": "verbose",
			"event_category": "updater",
			"event_action": "update-asset-install",
			"event_label": "",
			"event_value": ""
		},
		store.get("settings.opt_in_debug")
	);
	downloadAndInstall(arg);
});

module.exports = { checkForUpdates };
