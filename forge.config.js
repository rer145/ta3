const path = require('path');
const fs = require('fs-extra');
const package = require('./package.json');
const AdmZip = require('adm-zip');

// const el = require('electron-log');
// const log = el.create('forge');
// log.transports.file.fileName = "forge.log";

function make_directory(dir) {
	if (!fs.existsSync(dir)){
		try {
			fs.mkdirSync(dir);
		} catch (err) {
			console.log("Unable to create directory: " + err);
		}
	}
};

function empty_directory(dir) {
	if (!fs.existsSync(dir)){
		try {
			let files = fs.readdirSync(dir);
			for (var file in files) {
				fs.unlinkSync(path.join(dir, file));
			}
		} catch (err) {
			console.log("Unable to empty directory: " + err);
		}
	}
};

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




if (process.env['WINDOWS_CODESIGN_FILE']) {
	const certPath = path.join(__dirname, 'win-certificate.pfx');
	const certExists = fs.existsSync(certPath);
	if (certExists) {
		process.env['WINDOWS_CODESIGN_FILE'] = certPath;
	}
}

module.exports = {
	packagerConfig: {
		asar: false,	// can't be true due to dynamic files created for analysis
		icon: path.resolve(__dirname, 'assets', 'img', 'icons', 'icon'),
		appBundleId: 'edu.psu.TA3',
		appCategoryType: 'public.app-category.education',
		electronVersion: '6.0.7',
		overwrite: true,
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
			/\/build\/(.*)\.zip/,
			/\/dist(\/?)/
		]
	},
	makers: [
		// {
		// 	name: '@electron-forge/maker-squirrel',
		// 	platforms: ['win32'],
		// 	config: (arch) => {
		// 		return {
		// 			name: 'ta3',
		// 			authors: 'Ron Richardson',
		// 			noMsi: true,
		// 			remoteReleases: '',
		// 			setupExe: `ta3-${package.version}-setup-${arch}.exe`,
		// 			setupIcon: path.resolve(__dirname, 'build', 'icon.ico'),
		// 			certificateFile: process.env['WINDOWS_CODESIGN_FILE'],
		// 			certificatePassword: process.env['WINDOWS_CODESIGN_PASSWORD']
		// 		}
		// 	}
		// },
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
			// create working directory
			// download/copy r-portable from build
			// download/copy analysis assets from build
			// set config?

			make_directory(path.join(__dirname, "runtime"));
			make_directory(path.join(__dirname, "runtime", "analysis"));
			make_directory(path.join(__dirname, "runtime", "assets"));
			make_directory(path.join(__dirname, "runtime", "packages"));
			make_directory(path.join(__dirname, "runtime", "R-Portable"));

			let dest_root = path.join(__dirname, "runtime");

			let r_portable = path.join(__dirname, "build", "R-Portable");
			if (process.platform === "win32")
				r_portable = path.join(r_portable, "R-Portable-Win")
			else
				r_portable = path.join(r_portable, "R-Portable-Mac")
			let rprofile_path = path.join(dest_root, "R-Portable", "library", "base", "R", "Rprofile");

			fs.copy(r_portable, path.join(dest_root, "R-Portable"))
				.then(() => update_RProfile(rprofile_path, path.join(__dirname, "runtime", "packages")))
				.catch(err => console.error(err));

			let z_assets = new AdmZip(path.join(__dirname, "build", "assets.zip"));
			z_assets.extractAllTo(path.join(dest_root, "assets"));

			let z_packages = new AdmZip(path.join(__dirname, "build", "packages.zip"));
			z_packages.extractAllTo(path.join(dest_root, "packages"));

			empty_directory(path.join(dest_root, "analysis"));
		}
	}
};
