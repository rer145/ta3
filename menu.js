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
const store = new Store({ cwd: path.join(__dirname, "runtime") });

const cla = require('./assets/js/cla');
const log = require('./assets/js/logger');
const updater = require('./assets/js/updater');
const updater_assets = require('./assets/js/updater_assets');

const appName = app.getName();

const showPreferences = () => {
	win.getFocusedWindow().webContents.send('settings');
};

const showDataCollection = () => {
	win.getFocusedWindow().webContents.send('data-collection');
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
		label: 'Data Collection Form',
		click(menuItem, focusedWindow, event) {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "help",
					"event_value": "collection-form"
				},
				store.get("settings.opt_in_debug")
			);

			const PDFWindow = require('electron-pdf-window');
			const pdfWin = new PDFWindow({
				width: 800,
				height: 600,
				title: app.getName() + " - Trait Manual",
				backgroundColor: '#ffffff',
				transparent: false,
				icon: path.join(__dirname, "/assets/img/icons/icon.png")
			  });
			  pdfWin.loadURL(path.join(store.get("user.assets_path"), "/pdf/collection-form.pdf"));
		}
	},
	{
		label: 'User Guide',
		click(menuItem, focusedWindow, event) {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "help",
					"event_value": "user-guide"
				},
				store.get("settings.opt_in_debug")
			);

			const PDFWindow = require('electron-pdf-window');
			const pdfWin = new PDFWindow({
				width: 800,
				height: 600,
				title: app.getName() + " - Trait Manual",
				backgroundColor: '#ffffff',
				transparent: false,
				icon: path.join(__dirname, "/assets/img/icons/icon.png")
			  });
			  pdfWin.loadURL(path.join(store.get("user.assets_path"), "/pdf/user-guide.pdf"));
		}
	},
	{
		label: 'Trait Manual',
		click(menuItem, focusedWindow, event) {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "help",
					"event_value": "trait-manual"
				},
				store.get("settings.opt_in_debug")
			);

			const PDFWindow = require('electron-pdf-window');
			const pdfWin = new PDFWindow({
				width: 800,
				height: 600,
				title: app.getName() + " - Trait Manual",
				backgroundColor: '#ffffff',
				transparent: false,
				icon: path.join(__dirname, "/assets/img/icons/icon.png")
			  });
			  pdfWin.loadURL(path.join(store.get("user.assets_path"), "/pdf/trait-manual.pdf"));
		}
	},
	{ type: 'separator' },
	openUrlMenuItem({
		label: 'Website',
		url: 'https://statsmachine.net/software/TA3/'
	}),
	openUrlMenuItem({
		label: 'Source Code',
		url: 'https://github.com/rer145/ta3'
	}),
	{
		label: 'Report an Issue…',
		click() {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "help",
					"event_value": "report-issue"
				},
				store.get("settings.opt_in_debug")
			);

			// TODO: create modal form to report an issue and send logs

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
	// { type: 'separator' },
	// {
	// 	label: 'Check for App Updates',
	// 	click(menuItem, focusedWindow, event) {
	// 		log.log_debug(
	// 			"info",
	// 			{
	// 				"event_level": "info",
	// 				"event_category": "menu",
	// 				"event_action": "click",
	// 				"event_label": "help",
	// 				"event_value": "check-for-app-updates"
	// 			},
	// 			store.get("settings.opt_in_debug")
	// 		);

	// 		updater.checkForUpdates(menuItem, focusedWindow, event);
	// 	}
	// }
	// ,
	{
		label: 'Check for Asset Updates',
		click(menuItem, focusedWindow, event) {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "help",
					"event_value": "check-for-asset-updates"
				},
				store.get("settings.opt_in_debug")
			);

			updater_assets.checkForUpdates();
		}
	}
];

//if (!is.macos) {
	helpSubmenu.push(
		{
			type: 'separator'
		},
		{
			label: 'Data Collection and Privacy',
			click() {
				log.log_debug(
					"info",
					{
						"event_level": "info",
						"event_category": "menu",
						"event_action": "click",
						"event_label": "help",
						"event_value": "data-privacy"
					},
					store.get("settings.opt_in_debug")
				);
				showDataCollection();
			}
		},
		aboutMenuItem({
			icon: path.join(__dirname, 'assets', 'img', 'icons', 'icon.png'),
			text: `Created by Ron Richardson and Stephen Ousley\n\nVersions:\nApp: ${app.getVersion()}\nElectron: ${store.get("system.electron_version")}\nR-Portable: ${store.get("system.r_portable_version")}\nR Code: ${store.get("versions.analysis.analysis.version")}\nTA3BUM: ${store.get("versions.analysis.bum.version")}\nTA3OUM: ${store.get("versions.analysis.oum.version")}\nTA3 Case Scores: ${store.get("versions.analysis.case_scores.version")}\nDatabase: ${store.get("versions.database")}`,
			website: 'https://statsmachine.net/software/TA3/'
		})
	);
//}

const analysisMenu = [
	{
		label: 'View Case Info',
		click() {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "analysis",
					"event_value": "view-case-info"
				},
				store.get("settings.opt_in_debug")
			);

			showCaseInfo();
		}
	},
	{
		label: 'View Selections',
		click() {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "analysis",
					"event_value": "view-selections"
				},
				store.get("settings.opt_in_debug")
			);
			showSelections();
		}
	},
	{
		label: 'Run Analysis',
		click() {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "analysis",
					"event_value": "run-analysis"
				},
				store.get("settings.opt_in_debug")
			);
			runAnalysis();
		}
	},
	{
		label: 'View Results',
		click() {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "analysis",
					"event_value": "view-results"
				},
				store.get("settings.opt_in_debug")
			);
			showResults();
		}
	},
	{ type: 'separator' },
	{
		label: 'Use Basic Mode',
		type: 'radio',
		checked: store.get('settings.entry_mode') == 'basic',
		click() {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "analysis",
					"event_value": "entry-mode-basic"
				},
				store.get("settings.opt_in_debug")
			);
			store.set('settings.entry_mode', 'basic');
		}
	},
	{
		label: 'Use Advanced Mode (text)',
		type: 'radio',
		checked: store.get('settings.entry_mode') == 'advanced',
		click() {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "analysis",
					"event_value": "entry-mode-advanced"
				},
				store.get("settings.opt_in_debug")
			);
			store.set('settings.entry_mode', 'advanced');
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
	//{ role: 'reload' },
	{
		label: 'Force Reload',
		click() {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "debug",
					"event_value": "force-reload"
				},
				store.get("settings.opt_in_debug")
			);
			app.relaunch();
			app.quit();
		},
		accelerator: 'CmdOrCtrl+Shift+R'
	},
	{
		label: 'Developer Tools',
		click() {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "debug",
					"event_value": "developer-tools"
				},
				store.get("settings.opt_in_debug")
			);
			win.getFocusedWindow().toggleDevTools()
		},
		accelerator: 'CmdOrCtrl+Shift+I'
	},
	{ type: 'separator' },
	{
		label: 'Show App Data',
		click() {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "debug",
					"event_value": "show-app-data"
				},
				store.get("settings.opt_in_debug")
			);
			shell.openItem(app.getPath('userData'));
		}
	},
	{
		label: 'Delete App Data',
		click() {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "debug",
					"event_value": "delete-app-data"
				},
				store.get("settings.opt_in_debug")
			);
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
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "debug",
					"event_value": "delete-settings"
				},
				store.get("settings.opt_in_debug")
			);
			store.clear();
			app.relaunch();
			app.quit();
		}
	},
	{
		label: 'Run Installer',
		click() {
			log.log_debug(
				"info",
				{
					"event_level": "info",
					"event_category": "menu",
					"event_action": "click",
					"event_label": "debug",
					"event_value": "run-installer"
				},
				store.get("settings.opt_in_debug")
			);
			store.set("settings.first_run", true);
			app.relaunch();
			app.quit();
			//win.getFocusedWindow().webContents.send('check-installation');
		}
	}
];

const macosTemplate = [
	// appMenu([
	// 	{
	// 		label: 'Preferences…',
	// 		accelerator: 'Command+,',
	// 		click() {
	// 			showPreferences();
	// 		},
	// 		accelerator: 'CmdOrCtrl+Shift+P'
	// 	}
	// ]),
	{
		label: app.getName(),
		submenu: [
			{ role: 'about' },
			{
				label: 'Settings',
				click() {
					log.log_debug(
						"info",
						{
							"event_level": "info",
							"event_category": "menu",
							"event_action": "click",
							"event_label": "mac",
							"event_value": "settings"
						},
						store.get("settings.opt_in_debug")
					);
					showPreferences();
				},
				accelerator: 'CmdOrCtrl+Shift+P'
			},
			{ type: 'separator' },
			{ role: 'services', submenu: [] },
			{ role: 'hide' },
			{ role: 'hideothers' },
			{ role: 'unhide' },
			{ type: 'separator' },
			{ role: 'quit' }
		]
	},
	{
		role: 'fileMenu',
		submenu: [
			{
				label: 'New',
				click() {
					log.log_debug(
						"info",
						{
							"event_level": "info",
							"event_category": "menu",
							"event_action": "click",
							"event_label": "file",
							"event_value": "new"
						},
						store.get("settings.opt_in_debug")
					);
					win.getFocusedWindow().webContents.send('new-case');
				},
				accelerator: 'CmdOrCtrl+N'
			},
			{
				label: 'Open',
				click() {
					log.log_debug(
						"info",
						{
							"event_level": "info",
							"event_category": "menu",
							"event_action": "click",
							"event_label": "file",
							"event_value": "open"
						},
						store.get("settings.opt_in_debug")
					);
					win.getFocusedWindow().webContents.send('open-case');
				},
				accelerator: 'CmdOrCtrl+O'
			},
			{
				label: 'Save',
				click() {
					log.log_debug(
						"info",
						{
							"event_level": "info",
							"event_category": "menu",
							"event_action": "click",
							"event_label": "file",
							"event_value": "save"
						},
						store.get("settings.opt_in_debug")
					);
					win.getFocusedWindow().webContents.send('save-case');
				},
				accelerator: 'CmdOrCtrl+S'
			},
			{
				label: 'Save As...',
				click() {
					log.log_debug(
						"info",
						{
							"event_level": "info",
							"event_category": "menu",
							"event_action": "click",
							"event_label": "file",
							"event_value": "saveas"
						},
						store.get("settings.opt_in_debug")
					);
					win.getFocusedWindow().webContents.send('saveas-case');
				},
				accelerator: 'Shift+CmdOrCtrl+S'
			},
			{
				type: 'separator'
			},
			{
				label: 'Settings',
				click() {
					log.log_debug(
						"info",
						{
							"event_level": "info",
							"event_category": "menu",
							"event_action": "click",
							"event_label": "file",
							"event_value": "settings"
						},
						store.get("settings.opt_in_debug")
					);
					showPreferences();
				},
				accelerator: 'CmdOrCtrl+Shift+P'
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
	// {
	// 	role: 'windowMenu'
	// },
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
					log.log_debug(
						"info",
						{
							"event_level": "info",
							"event_category": "menu",
							"event_action": "click",
							"event_label": "file",
							"event_value": "new"
						},
						store.get("settings.opt_in_debug")
					);
					win.getFocusedWindow().webContents.send('new-case');
				},
				accelerator: 'CmdOrCtrl+N'
			},
			{
				label: 'Open',
				click() {
					log.log_debug(
						"info",
						{
							"event_level": "info",
							"event_category": "menu",
							"event_action": "click",
							"event_label": "file",
							"event_value": "open"
						},
						store.get("settings.opt_in_debug")
					);
					win.getFocusedWindow().webContents.send('open-case');
				},
				accelerator: 'CmdOrCtrl+O'
			},
			// {
			// 	label: 'Bulk Open',
			// 	click() {
			// 		log.log_debug(
			// 			"info",
			// 			{
			// 				"event_level": "info",
			// 				"event_category": "menu",
			// 				"event_action": "click",
			// 				"event_label": "file",
			// 				"event_value": "bulk_open"
			// 			},
			// 			store.get("settings.opt_in_debug")
			// 		);
			// 		win.getFocusedWindow().webContents.send('bulk-open-case');
			// 	},
			// 	accelerator: 'Shift+CmdOrCtrl+O'
			// },
			{
				label: 'Save',
				click() {
					log.log_debug(
						"info",
						{
							"event_level": "info",
							"event_category": "menu",
							"event_action": "click",
							"event_label": "file",
							"event_value": "save"
						},
						store.get("settings.opt_in_debug")
					);
					win.getFocusedWindow().webContents.send('save-case');
				},
				accelerator: 'CmdOrCtrl+S'
			},
			{
				label: 'Save As...',
				click() {
					log.log_debug(
						"info",
						{
							"event_level": "info",
							"event_category": "menu",
							"event_action": "click",
							"event_label": "file",
							"event_value": "saveas"
						},
						store.get("settings.opt_in_debug")
					);
					win.getFocusedWindow().webContents.send('saveas-case');
				},
				accelerator: 'Shift+CmdOrCtrl+S'
			},
			{
				type: 'separator'
			},
			{
				label: 'Settings',
				click() {
					log.log_debug(
						"info",
						{
							"event_level": "info",
							"event_category": "menu",
							"event_action": "click",
							"event_label": "file",
							"event_value": "settings"
						},
						store.get("settings.opt_in_debug")
					);
					showPreferences();
				},
				accelerator: 'CmdOrCtrl+Shift+P'
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
	// {
	// 	role: 'windowMenu'
	// },
	{
		role: 'help',
		submenu: helpSubmenu
	}
];

const template = process.platform === 'darwin' ? macosTemplate : otherTemplate;

if (is.development || cla.options.debug || store.get("settings.dev_mode")) {
	template.push({
		label: 'Debug',
		submenu: debugSubmenu
	});
}

module.exports = Menu.buildFromTemplate(template);
