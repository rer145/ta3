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
})();



function prep_files_and_settings() {
	const appVersion = require(path.join(app.getAppPath(), "package.json")).version;
	store.set("version", appVersion);

	if (!store.has("config.entry_mode")) {
		store.set("config.entry_mode", "basic");
	}

	if (!store.has("config.r_executable_path")) {
		store.set("config.r_executable_path", "");
	}

	var userDataPath = app.getPath("userData");
	store.set("config.userdata_path", userDataPath);

	var user_analysis_path = path.join(userDataPath, "analysis");
	make_directory(user_analysis_path);
	store.set("config.analysis_path", user_analysis_path);

	var user_r_path = path.join(userDataPath, "r");
	make_directory(user_r_path);
	store.set("config.r_path", user_r_path);

	var user_packages_path = path.join(user_r_path, "packages");
	make_directory(user_packages_path);
	store.set("config.packages_path", user_packages_path);

	var r_path = path.join(__dirname, "assets/r");
	var pkg_path = path.join(__dirname, "assets/r/packages");
	copy_file(
        path.join(r_path, "ta3.R"), 
        path.join(user_r_path, "ta3.R"), 
		true);
	copy_file(
		path.join(r_path, "TA3.Rda"), 
		path.join(user_r_path, "TA3.Rda"), 
		true);
	copy_file(
		path.join(r_path, "TA3BUM.Rda"), 
		path.join(user_r_path, "TA3BUM.Rda"), 
		true);
	copy_file(
		path.join(r_path, "TA3OUM.Rda"), 
		path.join(user_r_path, "TA3OUM.Rda"), 
		true);
	copy_file(
		path.join(r_path, "TA3_Case_Scores.Rda"), 
		path.join(user_r_path, "TA3_Case_Scores.Rda"), 
		true);
	copy_file(
		path.join(r_path, "install_package.R"), 
		path.join(user_r_path, "install_package.R"), 
		true);
	copy_file(
		path.join(r_path, "verify_package.R"), 
		path.join(user_r_path, "verify_package.R"), 
		true);

	// copy_file(path.join(pkg_path, "doParallel_1.0.15.zip"), path.join(user_packages_path, "doParallel_1.0.15.zip"), true);
	// copy_file(path.join(pkg_path, "foreach_1.4.7.zip"), path.join(user_packages_path, "foreach_1.4.7.zip"), true);
	// copy_file(path.join(pkg_path, "glmnet_3.0-1.zip"), path.join(user_packages_path, "glmnet_3.0-1.zip"), true);
	// copy_file(path.join(pkg_path, "gtools_3.8.1.zip"), path.join(user_packages_path, "gtools_3.8.1.zip"), true);
	// copy_file(path.join(pkg_path, "iterators_1.0.12.zip"), path.join(user_packages_path, "iterators_1.0.12.zip"), true);
	// copy_file(path.join(pkg_path, "MASS_7.3-51.4.zip"), path.join(user_packages_path, "MASS_7.3-51.4.zip"), true);
	// copy_file(path.join(pkg_path, "msir_1.3.2.zip"), path.join(user_packages_path, "msir_1.3.2.zip"), true);
	// copy_file(path.join(pkg_path, "randomGLM_1.02-1.zip"), path.join(user_packages_path, "randomGLM_1.02-1.zip"), true);
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