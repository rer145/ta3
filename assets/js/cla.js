'use strict';

const defs = [
	{ name: 'debug', alias: 'd', type: Boolean },
	{ name: 'forceInstall', alias: 'i', type: Boolean },
	{ name: 'resources', alias: 'r', type: String, multiple: false },
	{ name: 'analysis', alias: 'a', type: String, multiple: false },
	{ name: 'case', alias: 'c', type: String, multiple: false },
	{ name: 'analyze', alias: 'e', type: Boolean }
];

const commandLineArgs = require('command-line-args');
const options = commandLineArgs(defs, { partial: true, stopAtFirstUnknown: false });


module.exports = { options };
