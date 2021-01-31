const path = require('path');
const fs = require('fs-extra');
const rimraf = require('rimraf');

console.log("02-copy.js");

let dest_root = path.join(__dirname, "..", "..", "runtime");
let src_root = path.join(__dirname, "..", "..", "build");
let config_root = path.join(src_root, "configs");

console.log("  dest_root", dest_root);
console.log("  src_root", src_root);
console.log("  config_root", config_root);

console.log("02 done");
