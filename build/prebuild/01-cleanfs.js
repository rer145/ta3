const path = require('path');
const fs = require('fs-extra');
const rimraf = require('rimraf');

const isPortable = process.env['PORTABLE'] || true;
const isSlim = process.env['SLIM'] || false;


console.log("01-cleanfs.js");
console.log("  portable", process.env['PORTABLE'], isPortable);
console.log("  slim", process.env['SLIM'], isSlim);



let dest_root = path.join(__dirname, "..", "..", "runtime");
let src_root = path.join(__dirname, "..", "..", "build");
let config_root = path.join(src_root, "configs");

console.log("  dest_root", dest_root);
console.log("  src_root", src_root);
console.log("  config_root", config_root);


rimraf(dest_root, () => {
	console.log("    Deleted ", dest_root);

	fs.mkdir(dest_root, () => {
		console.log("    Created", dest_root);

		fs.mkdir(path.join(dest_root, "analysis"), () => {
			console.log("    Created ", path.join(dest_root, "analysis"));
		});

		fs.mkdir(path.join(dest_root, "assets"), () => {
			console.log("    Created ", path.join(dest_root, "assets"));
		});

		fs.mkdir(path.join(dest_root, "configs"), () => {
			console.log("    Created ", path.join(dest_root, "configs"));
		});

		fs.mkdir(path.join(dest_root, "packages"), () => {
			console.log("    Created ", path.join(dest_root, "packages"));
		});

		fs.mkdir(path.join(dest_root, "R-Portable"), () => {
			console.log("    Created ", path.join(dest_root, "R-Portable"));
		});

		console.log("01 done");
	});
});

