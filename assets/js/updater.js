const { dialog, ipcRenderer } = require('electron');
const { autoUpdater } = require('electron-updater');

const win = require('electron').BrowserWindow;

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
	updater.enabled = true;
	updater = null;

	win.getFocusedWindow().webContents.send('update-not-available', info);
});

autoUpdater.on('update-downloaded', (info) => {
	win.getFocusedWindow().webContents.send('update-downloaded', info);
});

function checkForUpdates(menuItem, focusedWindow, event) {
	updater = menuItem;
	updater.enabled = false;
	autoUpdater.checkForUpdates();
}

module.exports.checkForUpdates = checkForUpdates;