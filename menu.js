'use strict';
const path = require('path');
const {app, Menu, shell} = require('electron');
const win = require('electron').BrowserWindow;
const {
	is,
	appMenu,
	aboutMenuItem,
	openUrlMenuItem,
	openNewGitHubIssue,
	debugInfo
} = require('electron-util');
const Store = require('electron-store');
const store = new Store();

const updater = require('./assets/js/updater');

const showPreferences = () => {
	win.getFocusedWindow().webContents.send('settings');
};

const showCaseInfo = () => {
	win.getFocusedWindow().webContents.send('show-case-info');
};

const showSelections = () => {
	win.getFocusedWindow().webContents.send('show-selections');
};

const runAnalysis = () => {
	win.getFocusedWindow().webContents.send('run-analysis');
};

const showResults = () => {
	win.getFocusedWindow().webContents.send('show-results');
};

// const showRSettings = () => {
// 	win.getFocusedWindow().webContents.send('verify-r-settings');
// };

const helpSubmenu = [
	{
		label: 'User Guide',
		click(menuItem, focusedWindow, event) {
			win.getFocusedWindow().webContents.send('user-guide');
		}
	},
	{
		label: 'Trait Manual',
		click(menuItem, focusedWindow, event) {
			const PDFWindow = require('electron-pdf-window');
			const pdfWin = new PDFWindow({
				width: 800,
				height: 600,
				title: app.getName() + " - Trait Manual",
				backgroundColor: '#ffffff',
				transparent: false,
				icon: path.join(__dirname, "/assets/img/icons/icon.png")
			  });
			  pdfWin.loadURL(path.join(__dirname, "/assets/trait-manual.pdf"));
		}
	},
	{ type: 'separator' },
	openUrlMenuItem({
		label: 'Website',
		url: 'https://github.com/rer145/ta3'
	}),
	openUrlMenuItem({
		label: 'Source Code',
		url: 'https://github.com/rer145/ta3'
	}),
	{
		label: 'Report an Issue…',
		click() {
			const body = `
<!-- Please succinctly describe your issue and steps to reproduce it. -->


---

${debugInfo()}`;

			openNewGitHubIssue({
				user: 'rer145',
				repo: 'ta3',
				body
			});
		}
	},
	{ type: 'separator' },
	{
		label: 'Check for Updates',
		click(menuItem, focusedWindow, event) {
			updater.checkForUpdates(menuItem, focusedWindow, event);
		}
	}
];

if (!is.macos) {
	helpSubmenu.push(
		{
			type: 'separator'
		},
		aboutMenuItem({
			icon: path.join(__dirname, 'assets', 'img', 'icons', 'icon.png'),
			text: 'Created by Dr. Stephen Ousley and Ron Richardson'
		})
	);
}

const analysisMenu = [
	{
		label: 'View Case Info',
		click() {
			showCaseInfo();
		}
	},
	{
		label: 'View Selections',
		click() {
			showSelections();
		}
	},
	{
		label: 'Run Analysis',
		click() {
			runAnalysis();
		}
	},
	{
		label: 'View Results',
		click() {
			showResults();
		}
	},
	{ type: 'separator' },
	{
		label: 'Use Basic Mode',
		type: 'radio',
		checked: store.get('config.entry_mode') == 'basic',
		click() {
			store.set('config.entry_mode', 'basic');
		}
	},
	{
		label: 'Use Advanced Mode (text)',
		type: 'radio',
		checked: store.get('config.entry_mode') == 'advanced',
		click() {
			store.set('config.entry_mode', 'advanced');
		}
	},
	// {
	// 	label: 'Use Expert Mode (numerical)',
	// 	type: 'radio',
	// 	checked: store.get('config.entry_mode') == 'expert',
	// 	click() {
	// 		store.set('config.entry_mode', 'expert');
	// 	}
	// }
	// { type: 'separator' },
	// {
	// 	label: 'Verify R Settings',
	// 	click() {
	// 		showRSettings();
	// 	}
	// }
];

const debugSubmenu = [
	{ role: 'reload' },
	{ role: 'forcereload' },
	{ type: 'separator' },
	{
		label: 'Show App Data',
		click() {
			shell.openItem(app.getPath('userData'));
		}
	},
	{
		label: 'Delete App Data',
		click() {
			shell.moveItemToTrash(app.getPath('userData'));
			app.relaunch();
			app.quit();
		}
	},
	{
		type: 'separator'
	},
	// {
	// 	label: 'Show Settings',
	// 	click() {
	// 		config.openInEditor();
	// 	}
	// },
	{
		label: 'Delete Settings',
		click() {
			store.clear();
			app.relaunch();
			app.quit();
		}
	}
];

const macosTemplate = [
	appMenu([
		{
			label: 'Preferences…',
			accelerator: 'Command+,',
			click() {
				showPreferences();
			},
			accelerator: 'CmdOrCtrl+Shift+S'
		}
	]),
	{
		role: 'fileMenu',
		submenu: [
			{
				label: 'Custom'
			},
			{
				type: 'separator'
			},
			{
				role: 'close'
			}
		]
	},
	{
		label: 'Edit',
		submenu: [
			{ role: 'copy' },
			{ role: 'paste' },
			{ role: 'pasteAndMatchStyle' },
			{ role: 'selectAll' }
		]
	},
	{
		label: 'TA3 Analysis',
		submenu: analysisMenu
	},
	{
		label: 'View',
		submenu: [
			{ role: 'resetzoom' },
			{ role: 'zoomin' },
			{ role: 'zoomout' },
			{ type: 'separator' },
			{ role: 'togglefullscreen' }
		]
	},
	{
		role: 'windowMenu'
	},
	{
		role: 'help',
		submenu: helpSubmenu
	}
];

// Linux and Windows
const otherTemplate = [
	{
		role: 'fileMenu',
		submenu: [
			{
				label: 'New',
				click() {
					win.getFocusedWindow().webContents.send('new-case');
				},
				accelerator: 'CmdOrCtrl+N'
			},
			{
				label: 'Open',
				click() {
					win.getFocusedWindow().webContents.send('open-case');
				},
				accelerator: 'CmdOrCtrl+O'
			},
			{
				label: 'Save',
				click() {
					win.getFocusedWindow().webContents.send('save-case');
				},
				accelerator: 'CmdOrCtrl+S'
			},
			{
				type: 'separator'
			},
			{
				label: 'Settings',
				accelerator: 'Control+,',
				click() {
					showPreferences();
				},
				accelerator: 'CmdOrCtrl+Shift+S'
			},
			{
				type: 'separator'
			},
			{
				role: 'quit'
			}
		]
	},
	{
		label: 'Edit',
		submenu: [
			{ role: 'copy' },
			{ role: 'paste' },
			{ role: 'selectAll' }
		]
	},
	{
		label: 'TA3 Analysis',
		submenu: analysisMenu
	},
	{
		label: 'View',
		submenu: [
			{ role: 'resetzoom' },
			{ role: 'zoomin' },
			{ role: 'zoomout' },
			{ type: 'separator' },
			{ role: 'togglefullscreen' }
		]
	},
	{
		role: 'windowMenu'
	},
	{
		role: 'help',
		submenu: helpSubmenu
	}
];

const template = process.platform === 'darwin' ? macosTemplate : otherTemplate;

if (is.development) {
	template.push({
		label: 'Debug',
		submenu: debugSubmenu
	});
}

module.exports = Menu.buildFromTemplate(template);
