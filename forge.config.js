const path = require('path');
const fs = require('fs-extra');
const rimraf = require('rimraf');
const package = require('./package.json');
const AdmZip = require('adm-zip');


// SETUP FORGE CONFIGURATION

// console.log();
// console.log("**** SETUP FORGE CONFIGURATION ****");

// const isPortable = process.env['PORTABLE'] ? Boolean(process.env['PORTABLE']) : true;
// const isSlim = process.env['SLIM'] ? Boolean(process.env['SLIM']) : false;

const isPortable = false;
const isSlim = false;

const idxPlatform = process.argv.indexOf('--platform')
const idxArch = process.argv.indexOf('--arch')

const thisPlatform = process.platform
const thisArch = process.arch

const isWin32 = (idxPlatform > -1 && process.argv[idxPlatform + 1] === 'win32') || thisPlatform === 'win32'
const isMacOS = (idxPlatform > -1 && process.argv[idxPlatform + 1] === 'darwin') || thisPlatform === 'darwin'
const isLinux = (idxPlatform > -1 && process.argv[idxPlatform + 1] === 'linux') || thisPlatform === 'linux'
const isArm64 = (idxArch > -1 && process.argv[idxArch + 1] === 'arm64') || thisArch === 'arm64'
const is64Bit = (idxArch > -1 && process.argv[idxArch + 1] === 'x64') || thisArch === 'x64'


// console.log("  PORTABLE", isPortable);
// console.log("  SLIM", isSlim);


let applicationName = "Transition Analysis 3";
let applicationNameShort = "ta3";
if (isPortable) applicationName += " Portable";
if (isPortable) applicationNameShort += "-portable";
if (isSlim) applicationNameShort += "-slim";

// console.log("  Application Name", applicationName, applicationNameShort);

let platformName = "";
if (isWin32) platformName = "win";
if (isMacOS) platformName = "mac";
if (isLinux) platformName = "linux";

let archName = "";
if (isArm64) archName = "arm64";
if (is64Bit) archName = "x64";

// console.log("  Platform/Arch", platformName, archName);

let output_root = path.join(__dirname, "out");
let outputDirectory = applicationNameShort;
if (platformName != '') outputDirectory += "-" + platformName;
if (archName != '') outputDirectory += "-" + archName;
outputDirectory = path.join(output_root, outputDirectory);

// console.log("  Output Directory", outputDirectory);

function update_RProfile(rprofile_path, packages_path) {
	// update and copy Rprofile with .libPath() info
	let searchText = "### Setting TA3 .libPaths() ###";

	fs.readFile(rprofile_path, function(err, data) {
		if (err) {
			console.error(err);
			return;
		}

		if (!data.includes(searchText)) {
			let toAppend = "\n" + searchText + "\n.libPaths(c('" + packages_path.replace(/\\/g, "/") + "'))\n";

			fs.appendFile(rprofile_path, toAppend, function(err) {
				if (err) {
					console.err(err);
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
			console.error("Unable to create directory", err);
		}
	}
};





module.exports = {
	packagerConfig: {
		asar: false,	// can't be true due to dynamic files created for analysis
		icon: path.resolve(__dirname, 'assets', 'img', 'icons', 'icon'),
		name: applicationName,
		appBundleId: 'edu.psu.TA3',
		appCategoryType: 'public.app-category.education',
		electronVersion: '6.0.7',
		overwrite: true,
		prune: false,
		win32metadata: {
			CompanyName: 'Ron Richardson',
			OriginalFilename: 'ta3'
		},
		ignore: [
			/\/github(\/?)/,
			/package-lock\.json/,
			// /\/assets(\/?)/,
			/\/build\/R-Portable(\/?)/,
			/\/build\/setup(\/?)/,
			/\/build\/configs(\/?)/,
			/\/build\/(.*)\.zip/
		]
	},
	makers: [
		{
			name: '@electron-forge/maker-zip',
			platforms: ['darwin', 'win32']
		}
	],
	publishers: [
		{
			name: '@electron-forge/publisher-github',
			config: {
				repository: {
					owner: 'rer145',
					name: 'ta3'
				},
				draft: true,
				prerelease: true
			}
		}
	],
	hooks: {
		generateAssets: async() => {
			let dest_root = path.join(__dirname, "runtime");
			let src_root = path.join(__dirname, "build");
			let config_root = path.join(src_root, "configs");

			// console.log("  dest_root", dest_root);
			// console.log("  src_root", src_root);
			// console.log("  config_root", config_root);

			// console.log("**** WINDOWS CODE SIGNING ****");
			if (process.env['WINDOWS_CODESIGN_FILE']) {
				const certPath = path.join(__dirname, 'win-certificate.pfx');
				const certExists = fs.existsSync(certPath);
				if (certExists) {
					process.env['WINDOWS_CODESIGN_FILE'] = certPath;
				}
			}

			// console.log("**** PREPARE DIRECTORIES AND FILES ****");
			// rimraf.sync(outputDirectory);
			// rimraf.sync(dest_root);

			make_directory(dest_root);
			make_directory(path.join(dest_root, "analysis"));
			make_directory(path.join(dest_root, "assets"));
			make_directory(path.join(dest_root, "configs"));
			make_directory(path.join(dest_root, "packages"));
			make_directory(path.join(dest_root, "R-Portable"));

			// fs.mkdirSync(dest_root);
			// fs.mkdirSync(path.join(dest_root, "analysis"));
			// fs.mkdirSync(path.join(dest_root, "assets"));
			// fs.mkdirSync(path.join(dest_root, "configs"));
			// fs.mkdirSync(path.join(dest_root, "packages"));
			// fs.mkdirSync(path.join(dest_root, "R-Portable"));


			// copy over assets (always)
			let z_assets = new AdmZip(path.join(src_root, "assets.zip"));
			z_assets.extractAllTo(path.join(dest_root, "assets"), true);


			// copy config files for app usage/checks
			if (isPortable) {
				fs.copyFileSync(
					path.join(config_root, "portable.txt"),
					path.join(dest_root, "configs", "portable.txt")
				);
			}


			// check isSlim and copy over packages
			let z_packages = new AdmZip(path.join(src_root, "packages.zip"));
			z_packages.extractAllTo(path.join(dest_root, "packages"), true);


			// check isSlim and copy over R-Portable
			let r_portable = path.join(src_root, "R-Portable");
			if (isWin32)
				r_portable = path.join(r_portable, "R-Portable-Win")
			else
				r_portable = path.join(r_portable, "R-Portable-Mac")
			let rprofile_path = path.join(dest_root, "R-Portable", "library", "base", "R", "Rprofile");

			fs.copy(r_portable, path.join(dest_root, "R-Portable"))
				.then(() => {
					update_RProfile(rprofile_path, path.join(dest_root, "packages"));
				})
				.catch(err => console.error(err));
		},
		postPackage: async(config, options) => {
			// console.log("**** POST PACKAGE ****");

			let currentPath = '';
			let newPath = outputDirectory;

			if (options.outputPaths) {
				if (Array.isArray(options.outputPaths)) {
					if (options.outputPaths.length > 0) {
						currentPath = options.outputPaths[0];
					}
				} else {
					if (options.outputPaths.length > 0) {
						currentPath = options.outputPaths;
					}
				}

				if (currentPath != '') {
					// console.log("  Moving", currentPath, "to", newPath);

					// clear out config/window state files on deploy
					try { fs.unlinkSync(path.join(currentPath, "resources", "app", "runtime", "config.json")); } catch (err) { }
					try { fs.unlinkSync(path.join(currentPath, "resources", "app", "runtime", "window-state.json")); } catch (err) { }

					// // remove new destination directory
					// rimraf.sync(newPath);

					// fs.rename(currentPath, newPath, function(err) {
					// 	if (err) console.error(err);
					// 	if (!err) {
					// 		// clear out config/window state files on deploy
					// 		try { fs.unlinkSync(path.join(newPath, "resources", "app", "runtime", "config.json")); } catch (err) { console.error(err); }
					// 		try { fs.unlinkSync(path.join(newPath, "resources", "app", "runtime", "window-state.json")); } catch (err) { console.error(err); }
					// 	}
					// });
				}
			} else {
				console.error("UNABLE TO RENAME DIRECTORY");
			}
		}
	}
};
