'use strict';
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

unhandled();
debug();
contextMenu();

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
	const appVersion = require(path.join(app.getAppPath(), "package.json")).version;
	store.set("version", appVersion);

	let firstRun = !store.has("settings.first_run") ? true : store.get("settings.first_run");
	if (cla.options.forceInstall)
		firstRun = true;

	//let devMode = store.has("settings.dev_mode");
	let autoUpdates = !store.has("settings.auto_check_for_updates") ? true : store.get("settings.auto_check_for_updates");

	let entryMode = !store.has("settings.entry_mode") ? "basic" : store.get("settings.entry_mode");

	let devMode = !store.has("settings.dev_mode") ? false : store.get("settings.dev_mode");

	store.set("settings", {
		"auto_check_for_updates": autoUpdates,
		"first_run": firstRun,
		"entry_mode": entryMode,
		"dev_mode": devMode
	});


	// user paths
	let userDataPath = path.join(app.getPath("home"), "TA3");
	make_directory(userDataPath);

	let userPackagesPath = path.join(userDataPath, "packages");
	let userAnalysisPath = path.join(userDataPath, "analysis");
	make_directory(userPackagesPath);
	make_directory(userAnalysisPath);

	store.set("user", {
		"userdata_path": userDataPath,
		"packages_path": userPackagesPath,
		"analysis_path": userAnalysisPath
	});

	// check if packages is empty, if so, consider it the first_run
	fs.readdir(userPackagesPath, function(err, files) {
		if (err)
			console.error(err);
		else
			if (!files.length)
				store.set("settings.first_run", true);
	});



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
	}

	store.set("app", {
		"resources_path": resourcesPath,
		"rscript_path": RPortablePath,
		"r_analysis_path": RAnalysisPath
	});


	// update and copy Rprofile with .libPath() info
	let RProfileFile = path.join(
		resourcesPath, 
		"R-Portable", 
		is.macos ? "R-Portable-Mac" : "R-Portable-Win",
		"library", 
		"base",
		"R",
		"Rprofile");
	let searchText = "### Setting TA3 .libPaths() ###";

	fs.readFile(RProfileFile, function(err, data) {
		if (err) console.error(err);
		
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