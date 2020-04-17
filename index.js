'use strict';
const os = require('os');
const path = require('path');
const {app, BrowserWindow, Menu, ipcMain} = require('electron');
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
const store = new Store();

const cla = require('./assets/js/cla');
const log = require('./assets/js/logger');
const { v4: uuidv4 } = require('uuid');

unhandled({
	reportButton: error => {
		openNewGitHubIssue({
			user: 'rer145',
			repo: 'mamd-analytical',
			body: `\`\`\`\n${error.stack}\n\`\`\`\n\n---\n\n${debugInfo()}`
		});
	}
});

debug();
contextMenu({
	showCopyImage: true,
	showCopyImageAddress: false,
	showSaveImage: false,
	showSaveImageAs: true
});

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
		defaultHeight: 768
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

	mainWindowState.manage(win);

	win.on('ready-to-show', () => {
		win.show();
	});

	win.webContents.on('did-finish-load', () => {
		win.webContents.setZoomFactor(1);
	});

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

	mainWindow.webContents.send('application-ready', cla.options);
})();



function prep_files_and_settings() {
	// console.log("process args");
	// console.log(process.argv);
	// console.log("cla");
	// console.log(cla.options);

	//const appVersion = require(path.join(app.getAppPath(), "package.json")).version;
	const appVersion = app.getVersion();
	//store.set("version", appVersion);

	const systemInfo = {
		"node_version": process.versions['node'],
		"electron_version": process.versions['electron'],
		"chrome_version": process.versions['chrome'].replace(/\.\d+$/, ''),
		"platform": process.platform,
		"arch": process.arch,
		"platform_release": os.release(),
		"locale": app.getLocale(),
		"locale_country_code": app.getLocaleCountryCode(),
		"r_portable_version": '3.6.2',
		"r_code_version": '0.4.5',
		"db_version": '1.0.0'
	};


	let uid = store.get("uuid", uuidv4());
	let analytics = store.get("settings.analytics", true);

	let firstRun = !store.has("settings.first_run") ? true : store.get("settings.first_run");
	if (cla.options.forceInstall)
		firstRun = true;

	//let devMode = store.has("settings.dev_mode");
	let autoUpdates = !store.has("settings.auto_check_for_updates") ? true : store.get("settings.auto_check_for_updates");
	let entryMode = !store.has("settings.entry_mode") ? "basic" : store.get("settings.entry_mode");
	let devMode = !store.has("settings.dev_mode") ? false : store.get("settings.dev_mode");

	// store.set("settings", {
	// 	"auto_check_for_updates": autoUpdates,
	// 	"first_run": firstRun,
	// 	"entry_mode": entryMode,
	// 	"dev_mode": devMode
	// });


	// user paths
	let userDataPath = path.join(app.getPath("home"), "TA3");
	make_directory(userDataPath);

	let userPackagesPath = path.join(userDataPath, "packages");
	let userAnalysisPath = path.join(userDataPath, "analysis");
	make_directory(userPackagesPath);
	make_directory(userAnalysisPath);

	// store.set("user", {
	// 	"userdata_path": userDataPath,
	// 	"packages_path": userPackagesPath,
	// 	"analysis_path": userAnalysisPath
	// });

	// check if packages is empty, if so, consider it the first_run
	if (fs.readdirSync(userPackagesPath).length == 0)
		firstRun = true;



	// app paths
	let resourcesPath = process.resourcesPath;
	if (cla.options && cla.options.resources && cla.options.resources.length > 0) {
		resourcesPath = cla.options.resources;
	} else {
		if (is.development) {
			resourcesPath = path.join(__dirname, "build");	
		}
	}

	let RPortablePath = path.join(resourcesPath, "R-Portable", "bin", "RScript.exe");
	let RProfileFile = path.join(resourcesPath, "R-Portable", "library", "base", "R", "Rprofile");
	let RAnalysisPath = path.join(resourcesPath, "scripts");
	if (cla.options && cla.options.analysis && cla.options.analysis.length > 0) {
		RAnalysisPath = cla.options.analysis;
	}
	
	if (is.development) {
		RPortablePath = path.join(
			resourcesPath, 
			"R-Portable", 
			is.macos ? "R-Portable-Mac" : "R-Portable-Win",
			"bin", 
			"RScript.exe");

		RProfileFile = path.join(
			resourcesPath, 
			"R-Portable", 
			is.macos ? "R-Portable-Mac" : "R-Portable-Win",
			"library", 
			"base",
			"R",
			"Rprofile");
	}

	// mac only - R-Portable will be copied to user home directory
	//  unable to execute within asar package
	if (is.macos) {
		let RPortable = path.join(userDataPath, "R-Portable");
		make_directory(RPortable);

		if (fs.readdirSync(RPortable).length == 0)
			firstRun = true;

		RPortablePath = path.join(
			userDataPath,
			"R-Portable",
			"bin",
			"RScript"
		);
	}


	// // windows only - copy over installation batch files
	// if (is.windows) {

	// }

	// store.set("app", {
	// 	"resources_path": resourcesPath,
	// 	"rscript_path": RPortablePath,
	// 	"r_analysis_path": RAnalysisPath
	// });


	let settings = {
		"version": appVersion,
		"uuid": uid,
		"settings": {
			"analytics": analytics,
			"auto_check_for_updates": autoUpdates,
			"first_run": firstRun,
			"entry_mode": entryMode,
			"dev_mode": devMode
		},
		"system": systemInfo,
		"user": {
			"userdata_path": userDataPath,
			"packages_path": userPackagesPath,
			"analysis_path": userAnalysisPath
		},
		"app": {
			"resources_path": resourcesPath,
			"rscript_path": RPortablePath,
			"r_analysis_path": RAnalysisPath
		}
	};
	store.set(settings);


	// update and copy Rprofile with .libPath() info
	let searchText = "### Setting TA3 .libPaths() ###";

	fs.readFile(RProfileFile, function(err, data) {
		if (err) {
			console.error(err);
			return;
		}
		
		if (!data.includes(searchText)) {
			let toAppend = "\n" + searchText + "\n.libPaths(c('" + userPackagesPath.replace(/\\/g, "/") + "'))\n";
			
			fs.appendFile(RProfileFile, toAppend, function(err) {
				if (err) console.err(err);
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
            } else {
                console.log(src + " was copied to " + dest);
            }
		});
	}
};




ipcMain.on("download-file", (event, info) => {
	info.properties.onProgress = status => mainWindow.webContents.send("download-progress", status);
	download(BrowserWindow.getFocusedWindow(), info.url, info.properties)
		.then(dl => {
			mainWindow.webContents.send("download-complete", dl.getSavePath());
		});
});