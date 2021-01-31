'use strict';

const path = require('path');
const {is} = require('electron-util');
const https = require('https');
const fs = require('fs');
const async = require('async');
const axios = require('axios').default;
const now = require('performance-now');

const Store = require('electron-store');
const store = new Store({ cwd: path.join(__dirname, "runtime") });

const exec = require('./exec');
const log = require('./logger');

let scripts_path = path.join(store.get("app.resources_path"), "setup");


function check_app_install() {}
function check_assets() {}

function install_assets() {}
function install_rportable() {}
function install_packages() {}



module.exports = {

};
