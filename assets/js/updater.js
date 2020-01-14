const { dialog, ipcRenderer } = require('electron');
const { autoUpdater } = require('electron-updater');

const win = require('electron').BrowserWindow;
const { ipcMain } = require("electron");

let updater;
autoUpdater.autoDownload = false;

autoUpdater.on('error', (error) => {
	win.getFocusedWindow().webContents.send('update-error', error);
});

autoUpdater.on('checking-for-update', () => {
	win.getFocusedWindow().webContents.send('update-checking');
});

autoUpdater.on('update-available', (info) => {
	win.getFocusedWindow().webContents.send('update-available', info);
});

autoUpdater.on('download-progress', (progressObj) => {
	win.getFocusedWindow().webContents.send('update-progress', progressObj);
});

autoUpdater.on('update-not-available', (info) => {
	if (updater != null) {
		updater.enabled = true;
		updater = null;
	}

	win.getFocusedWindow().webContents.send('update-not-available', info);
});

autoUpdater.on('update-downloaded', (info) => {
	win.getFocusedWindow().webContents.send('update-downloaded', info);
});

function checkForUpdates(menuItem, focusedWindow, event) {
	if (menuItem != null) {
		updater = menuItem;
		//updater.enabled = false;
	}

	autoUpdater.checkForUpdates();
}

function downloadUpdate() {
	autoUpdater.downloadUpdate();
}

function installUpdate() {
	autoUpdater.quitAndInstall();
}

ipcMain.on('update-download', () => {
	downloadUpdate();
});

ipcMain.on('update-install', () => {
	installUpdate();
});

module.exports.checkForUpdates = checkForUpdates;