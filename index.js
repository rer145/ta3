'use strict';
const os = require('os');
const path = require('path');
const {app, BrowserWindow, Menu, ipcMain, dialog} = require('electron');
/// const {autoUpdater} = require('electron-updater');
const {is} = require('electron-util');
const unhandled = require('electron-unhandled');
const debug = require('electron-debug');
const contextMenu = require('electron-context-menu');
const windowStateKeeper = require('electron-window-state');
const {download} = require("electron-dl");
//const config = require('./config');
const menu = require('./menu');
const fs = require('fs');

const Store = require('electron-store');
const store = new Store({ cwd: path.join(__dirname, "runtime") });

const cla = require('./assets/js/cla');
const log = require('./assets/js/logger');
const { v4: uuidv4 } = require('uuid');

// const setup = require('./assets/js/setup');
 const updater_assets = require('./assets/js/updater_assets');

unhandled({
	reportButton: error => {
		log.log_debug(
			"error",
			{
				"event_level": "error",
				"event_category": "exception",
				"event_action": "unhandled",
				"event_label": "",
				"event_value": JSON.stringify(error.stack)
			},
			true
		);
		// openNewGitHubIssue({
		// 	user: 'rer145',
		// 	repo: 'mamd-analytical',
		// 	body: `\`\`\`\n${error.stack}\n\`\`\`\n\n---\n\n${debugInfo()}`
		// });
	}
});

debug();
contextMenu({
	showCopyImage: true,
	showCopyImageAddress: false,
	showSaveImage: false,
	showSaveImageAs: true
});

// contextMenu({
// 	prepend: (defaultActions, params, browserWindow) => [
// 		{
// 			label: 'Save',
// 			visible: params.mediaType === 'image',
// 			click(menuItem) {
// 				download(win, params.srcURL, {saveAs: true});
// 			}
// 		}
// 	],
// 	showSaveImage: false,
// 	showSaveImageAs: false,
// 	showCopyImage: false,
// 	showCopyImageAddress: false
// });


// Note: Must match `build.appId` in package.json
app.setAppUserModelId('edu.psu.TA3');

// Uncomment this before publishing your first version.
// It's commented out as it throws an error if there are no published versions.
// if (!is.development) {
// 	const FOUR_HOURS = 1000 * 60 * 60 * 4;
// 	setInterval(() => {
// 		autoUpdater.checkForUpdates();
// 	}, FOUR_HOURS);
//
// 	autoUpdater.checkForUpdates();
// }

// Prevent window from being garbage collected
let mainWindow;

const createMainWindow = async () => {
	let mainWindowState = windowStateKeeper({
		defaultWidth: 1024,
		defaultHeight: 768,
		path: path.join(__dirname, "runtime")
	  });

	const win = new BrowserWindow({
		title: app.getName(),
		show: false,
		// width: 1024,
		// height: 768,
		x: mainWindowState.x,
		y: mainWindowState.y,
		width: mainWindowState.width,
		height: mainWindowState.height,
		backgroundColor: '#ffffff',
		transparent: false,
		icon: path.join(__dirname, 'assets/img/icons/icon.png'),
		webPreferences: {
			nodeIntegration: true,
			defaultEncoding: 'UTF-8',
			disableBlinkFeatures: "Auxclick"
		}
	});

	if (is.development || cla.options.debug || store.get("settings.dev_mode")) {
		win.toggleDevTools();
	}

	mainWindowState.manage(win);

	win.on('ready-to-show', () => {
		win.show();
	});

	win.webContents.on('did-finish-load', () => {
		win.webContents.setZoomFactor(1);
	});

	// win.on('close', (e) => {
	// 	if (win){
	// 		e.preventDefault();
	// 		win.webContents.send('application-quit', cla.options);
	// 	}
	// });

	win.on('closed', () => {
		// Dereference the window
		// For multiple windows store them in an array
		mainWindow = undefined;
	});

	await win.loadFile(path.join(__dirname, 'index.html'));

	return win;
};

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
	app.quit();
}

app.on('second-instance', () => {
	if (mainWindow) {
		if (mainWindow.isMinimized()) {
			mainWindow.restore();
		}

		mainWindow.show();
	}
});

app.on('window-all-closed', () => {
	if (!is.macos) {
		app.quit();
	}
});

app.on('activate', async () => {
	if (!mainWindow) {
		mainWindow = await createMainWindow();
	}
});

(async () => {
	prep_files_and_settings();

	await app.whenReady();
	Menu.setApplicationMenu(menu);
	mainWindow = await createMainWindow();

	log.log_debug(
		"verbose",
		{
			"event_level": "verbose",
			"event_category": "main",
			"event_action": "application-ready",
			"event_label": "",
			"event_value": ""
		},
		store.get("settings.opt_in_debug")
	);

	mainWindow.webContents.send('application-ready', cla.options);
})();


function prep_files_and_settings() {

	let version = app.getVersion();
	let uuid = store.get("uuid", uuidv4());

	let config = {
		"version": version,
		"uuid": uuid,
		"session": uuidv4()
	};



	let optInAnalysis = store.get("settings.opt_in_analysis", false);
	let optInDebug = store.get("settings.opt_in_debug", false);
	let optInAnalysisDate = store.get("settings.opt_in_analysis_date", "");
	let optInDebugDate = store.get("settings.opt_in_debug_date", "");

	let autoUpdates = store.get("settings.auto_check_for_updates", true);
	let entryMode = store.get("settings.entry_mode", "basic");

	let devMode = store.get("settings.dev_mode", false);
	if (cla.options && cla.options.debug)
		devMode = true;
	if (is.development)
		devMode = true;

	let firstRun = store.get("settings.first_run", true);
	if (cla.options && cla.options.forceInstall)
		firstRun = true;

	let settings_config = {
		"opt_in_analysis": optInAnalysis,
		"opt_in_debug": optInDebug,
		"opt_in_analysis_date": optInAnalysisDate,
		"opt_in_debug_date": optInDebugDate,
		"auto_check_for_updates": autoUpdates,
		"first_run": firstRun,
		"entry_mode": entryMode,
		"dev_mode": devMode
	};



	let system_config = {
		"node_version": process.versions['node'],
		"electron_version": process.versions['electron'],
		"chrome_version": process.versions['chrome'].replace(/\.\d+$/, ''),
		"platform": process.platform,
		"arch": process.arch,
		"platform_release": os.release(),
		"locale": app.getLocale(),
		"locale_country_code": app.getLocaleCountryCode(),
		"r_portable_version": '3.6.2'
	};



	//let userDataPath = path.join(app.getPath("home"), "TA3");
	let userDataPath = path.join(__dirname, "runtime");
	let userPackagesPath = path.join(userDataPath, "packages");
	let userAnalysisPath = path.join(userDataPath, "analysis");
	let userAssetsPath = path.join(userDataPath, "assets");
	make_directory(userDataPath);
	make_directory(userPackagesPath);
	make_directory(userAnalysisPath);
	make_directory(userAssetsPath);
	make_directory(path.join(userAssetsPath, "analysis"));
	make_directory(path.join(userAssetsPath, "pdf"));
	make_directory(path.join(userAssetsPath, "database"));

	let user_config = {
		"userdata_path": userDataPath,
		"packages_path": userPackagesPath,
		"analysis_path": userAnalysisPath,
		"assets_path": userAssetsPath
	};

	if (fs.readdirSync(userPackagesPath).length == 0)
		settings_config["first_run"] = true;



	let resourcesPath = process.resourcesPath;
	if (cla.options && cla.options.resources && cla.options.resources.length > 0) {
		resourcesPath = cla.options.resources;
	} else {
		if (is.development) {
			resourcesPath = path.join(__dirname, "build");
		}
	}
	resourcesPath = path.join(__dirname, "runtime");

	let RPortablePath = path.join(resourcesPath, "R-Portable", "bin", "RScript.exe");
	let RProfileFile = path.join(resourcesPath, "R-Portable", "library", "base", "R", "Rprofile");

	let RAnalysisPath = path.join(userAssetsPath, "analysis");
	if (cla.options && cla.options.analysis && cla.options.analysis.length > 0)
		RAnalysisPath = cla.options.analysis;

	// if (is.development) {
	// 	RPortablePath = path.join(
	// 		resourcesPath,
	// 		"R-Portable",
	// 		is.macos ? "R-Portable-Mac" : "R-Portable-Win",
	// 		"bin",
	// 		"RScript.exe"
	// 	);

	// 	RProfileFile = path.join(
	// 		resourcesPath,
	// 		"R-Portable",
	// 		is.macos ? "R-Portable-Mac" : "R-Portable-Win",
	// 		"library",
	// 		"base",
	// 		"R",
	// 		"Rprofile"
	// 	);
	// }

	// mac only - R-Portable will be copied to user home directory
	//   during initial setup process
	//   Unable to execute when inside asar package
	if (is.macos) {
		let RPortable = path.join(userDataPath, "R-Portable");
		make_directory(RPortable);

		if (fs.readdirSync(RPortable).length == 0)
			settings_config['first_run'] = true;

		RPortablePath = path.join(
			userDataPath,
			"R-Portable",
			"bin",
			"RScript"
		);
	}

	let app_config = {
		"resources_path": resourcesPath,
		"rscript_path": RPortablePath,
		"r_analysis_path": RAnalysisPath
	};


	settings_config['first_run'] = false;	// portable only
	config['settings'] = settings_config;
	config['system'] = system_config;
	config['user'] = user_config;
	config['app'] = app_config;

	if (!store.has("versions")) {
		let latest_text = fs.readFileSync(path.join(__dirname, "runtime", "assets", "latest.json"));
		let latest_json = JSON.parse(latest_text);

		let version_config = {
			"analysis": {
				"install": { "file": "install.R", "version": store.get("versions.analysis.install.version", latest_json.analysis.install.version) },
				"analysis": { "file": "ta3.R", "version": store.get("versions.analysis.analysis.version", latest_json.analysis.analysis.version) },
				"case_scores": { "file": "TA3_Case_Scores.Rda", "version": store.get("versions.analysis.case_scores.version", latest_json.analysis.case_scores.version) },
				"bum": { "file": "TA3BUM.Rda", "version": store.get("versions.analysis.bum.version", latest_json.analysis.bum.version) },
				"oum": { "file": "TA3OUM.Rda", "version": store.get("versions.analysis.oum.version", latest_json.analysis.oum.version) }
			},
			"pdf": {
				"trait_manual": { "file": "trait-manual.pdf", "version": store.get("versions.pdf.trait_manual.version", latest_json.pdf.trait_manual.version) },
				"collection_form": { "file": "collection-form.pdf", "version": store.get("versions.pdf.collection_form.version", latest_json.pdf.collection_form.version) },
				"user_guide": { "file": "user-guide.pdf", "version": store.get("versions.pdf.user_guide.version", latest_json.pdf.user_guide.version) }
			},
			"application": version,
			"r_portable": store.get("versions.r_portable", latest_json.r_portable),
			"database": store.get("versions.database", latest_json.database)
		};
		config['versions'] = version_config;
	} else {
		config['versions'] = store.get("versions");
	}

	store.set(config);


	//update_RProfile(RProfileFile, userPackagesPath);
}

function update_RProfile(rprofile_path, packages_path) {
	// update and copy Rprofile with .libPath() info
	let searchText = "### Setting TA3 .libPaths() ###";

	fs.readFile(rprofile_path, function(err, data) {
		if (err) {
			console.error(err);
			log.log_debug(
				"error",
				{
					"event_level": "error",
					"event_category": "exception",
					"event_action": "update_RProfile",
					"event_label": "fs.readFile",
					"event_value": JSON.stringify(err)
				},
				store.get("settings.opt_in_debug")
			);

			return;
		}

		if (!data.includes(searchText)) {
			let toAppend = "\n" + searchText + "\n.libPaths(c('" + packages_path.replace(/\\/g, "/") + "'))\n";

			fs.appendFile(rprofile_path, toAppend, function(err) {
				if (err) {
					console.err(err);
					log.log_debug(
						"error",
						{
							"event_level": "error",
							"event_category": "exception",
							"event_action": "update_RProfile",
							"event_label": "fs.appendFile",
							"event_value": JSON.stringify(err)
						},
						store.get("settings.opt_in_debug")
					);
				}
				//console.log("Rprofile settings updated");
			});
		}
	});
}

function make_directory(dir) {
	if (!fs.existsSync(dir)){
		try {
			fs.mkdirSync(dir);
		} catch (err) {
			console.log("Unable to create directory: " + err);
			log.log_debug(
				"error",
				{
					"event_level": "error",
					"event_category": "exception",
					"event_action": "make_directory",
					"event_label": dir,
					"event_value": JSON.stringify(err)
				},
				store.get("settings.opt_in_debug")
			);
		}
	}
};

function copy_file(src, dest, replace) {
	var do_replace = replace;
	if (!replace) {
		do_replace = !fs.existsSync(dest);
	}

	if (do_replace) {
		fs.copyFile(src, dest, (err) => {
			if (err) {
                console.error("Error copying over " + src + " to " + dest);
				console.error(err);
				log.log_debug(
					"error",
					{
						"event_level": "error",
						"event_category": "exception",
						"event_action": "copy_fie",
						"event_label": { "src": src, "dest": dest, "replace": replace },
						"event_value": JSON.stringify(err)
					},
					store.get("settings.opt_in_debug")
				);
            } else {
                console.log(src + " was copied to " + dest);
            }
		});
	}
};


ipcMain.on("download-file", (event, info) => {
	log.log_debug(
		"info",
		{
			"event_level": "info",
			"event_category": "main",
			"event_action": "download-file",
			"event_label": "",
			"event_value": info.url
		},
		store.get("settings.opt_in_debug")
	);

	info.properties.onProgress = status => mainWindow.webContents.send("download-progress", status);
	download(BrowserWindow.getFocusedWindow(), info.url, info.properties)
		.then(dl => {
			mainWindow.webContents.send("download-complete", dl.getSavePath());
		});
});


// ipcMain.on('application-closed', _ => {
// 	mainWindow = undefined;
// 	if (process.platform !== 'darwin') {
// 		app.quit();
// 	}
// });
