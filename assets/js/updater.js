const { dialog, ipcRenderer } = require('electron');
const { autoUpdater } = require('electron-updater');

const win = require('electron').BrowserWindow;
const { ipcMain } = require("electron");

const log = require('./logger');
const Store = require('electron-store');
const store = new Store();

let updater;
autoUpdater.autoDownload = false;

autoUpdater.on('error', (error) => {
	log.log_debug(
		"error", 
		{
			"event_level": "error",
			"event_category": "updater",
			"event_action": "error",
			"event_label": "",
			"event_value": JSON.stringify(error)
		}, 
		store.get("settings.opt_in_debug")
	);
	win.getFocusedWindow().webContents.send('update-error', error);
});

autoUpdater.on('checking-for-update', () => {
	log.log_debug(
		"verbose", 
		{
			"event_level": "verbose",
			"event_category": "updater",
			"event_action": "checking-for-update",
			"event_label": "",
			"event_value": ""
		}, 
		store.get("settings.opt_in_debug")
	);
	win.getFocusedWindow().webContents.send('update-checking');
});

autoUpdater.on('update-available', (info) => {
	log.log_debug(
		"verbose", 
		{
			"event_level": "verbose",
			"event_category": "updater",
			"event_action": "update-available",
			"event_label": "",
			"event_value": JSON.stringify(info)
		}, 
		store.get("settings.opt_in_debug")
	);
	win.getFocusedWindow().webContents.send('update-available', info);
});

autoUpdater.on('download-progress', (progressObj) => {
	win.getFocusedWindow().webContents.send('update-progress', progressObj);
});

autoUpdater.on('update-not-available', (info) => {
	log.log_debug(
		"verbose", 
		{
			"event_level": "verbose",
			"event_category": "updater",
			"event_action": "update-not-available",
			"event_label": "",
			"event_value": JSON.stringify(info)
		}, 
		store.get("settings.opt_in_debug")
	);

	if (updater != null) {
		updater.enabled = true;
		updater = null;
	}

	win.getFocusedWindow().webContents.send('update-not-available', info);
});

autoUpdater.on('update-downloaded', (info) => {
	log.log_debug(
		"verbose", 
		{
			"event_level": "verbose",
			"event_category": "updater",
			"event_action": "update-downloaded",
			"event_label": "",
			"event_value": JSON.stringify(info)
		}, 
		store.get("settings.opt_in_debug")
	);
	win.getFocusedWindow().webContents.send('update-downloaded', info);
});

function checkForUpdates(menuItem, focusedWindow, event) {
	log.log_debug(
		"verbose", 
		{
			"event_level": "verbose",
			"event_category": "updater",
			"event_action": "checkForUpdates",
			"event_label": "",
			"event_value": ""
		}, 
		store.get("settings.opt_in_debug")
	);

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
	log.log_debug(
		"verbose", 
		{
			"event_level": "verbose",
			"event_category": "updater",
			"event_action": "update-download",
			"event_label": "",
			"event_value": ""
		}, 
		store.get("settings.opt_in_debug")
	);
	downloadUpdate();
});

ipcMain.on('update-install', () => {
	log.log_debug(
		"verbose", 
		{
			"event_level": "verbose",
			"event_category": "updater",
			"event_action": "update-install",
			"event_label": "",
			"event_value": ""
		}, 
		store.get("settings.opt_in_debug")
	);
	installUpdate();
});

module.exports.checkForUpdates = checkForUpdates;