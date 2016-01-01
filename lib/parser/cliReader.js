/*
 * Parses command line arguments
 * 'argparse' node_module is used to parse the command line arguments
 */

/*jslint plusplus: true */
/*jslint node:true */
/*jslint nomen: true */

var ArgumentParser = require('argparse').ArgumentParser,
	colors = require('colors'),
	path = require('path'),
	jsonfile = require('jsonfile'),
	packageJSONPath = path.join(__dirname, '../../', './package.json'),
	clientPackageJSONPath = path.join(__dirname, '../client/', './package.json'),
	clientConfigJSONPath = path.join(__dirname, '../client/', './config.json'),
	version = require(packageJSONPath).version,
	clientPackageJSON = require(clientPackageJSONPath),
	clientConfigJSON = require(clientConfigJSONPath),
	args = {};

/*
 * CLI arguments
 */

args.directory = {};
args.directory.name = ['-m', '--directory'];
args.directory.options = {
	help: 'Specify the directory and run the unit test only for the source files inside the directory'
};
args.file = {};
args.file.name = ['-f', '--file'];
args.file.options = {
	help: 'Specify a file or a set of files(comma seperated and without white-space) and run the unit test only for the files'
};
args.doNotRunCoverage = {};
args.doNotRunCoverage.name = ['-d', '--doNotRunCoverage'];
args.doNotRunCoverage.options = {
	help: 'Specify a boolean value to check if coverage needs to be run for source files that have no tests'
};
args.closeNW = {};
args.closeNW.name = ['-c', '--close'];
args.closeNW.options = {
	help: 'Specify a boolean value to either close or not to close the Node Webkit after completing the unit test. Default is true'
};
args.showNW = {};
args.showNW.name = ['-s', '--show'];
args.showNW.options = {
	help: 'Specify a boolean value to either show or not to show the Node Webkit. Default is false'
};

var parser = new ArgumentParser({
	version: version,
	addHelp: true,
	description: ''
});

parser.addArgument(args.directory.name, args.directory.options);
parser.addArgument(args.file.name, args.file.options);
parser.addArgument(args.doNotRunCoverage.name, args.doNotRunCoverage.options);
parser.addArgument(args.closeNW.name, args.closeNW.options);
parser.addArgument(args.showNW.name, args.showNW.options);

var cliArgs = parser.parseArgs();

function writeJSONFile(JSONObj, JSONFile) {
	'use strict';
	jsonfile.spaces = 4;
	jsonfile.writeFileSync(JSONFile, JSONObj); // will have 4 spaces indentation 
}

function parseTestFilesCLI(testFiles) {
	'use strict';
	try {
		var i = 0,
			returnTestFiles = [],
			testFileArray,
			closure,
			removeIndex;

		closure = function (index) {
			return function (item) {
				var resolvedItem = path.resolve(item),
					cliTestFile = path.sep + path.normalize(cliArgs.file[index]);
				return resolvedItem.indexOf(cliTestFile) !== -1;
			};
		};

		if (cliArgs.closeNW) {
			clientConfigJSON.nodeWebkit.closeNW = (cliArgs.closeNW.toString().toUpperCase() === 'TRUE') ? true : false;
			writeJSONFile(clientConfigJSON, clientConfigJSONPath);
		}
		if (cliArgs.showNW) {
			clientPackageJSON.window.show = (cliArgs.showNW.toString().toUpperCase() === 'TRUE') ? true : false;
			writeJSONFile(clientPackageJSON, clientPackageJSONPath);
		}
		if (cliArgs.directory) {
			testFiles = testFiles.filter(function (item) {
				var resolvedItem = path.resolve(item),
					cliDirectory = path.sep + path.normalize(cliArgs.directory) + path.sep;
				return resolvedItem.indexOf(cliDirectory) !== -1;
			});
		}
		if (cliArgs.file) {
			cliArgs.file = cliArgs.file.split(',');
			for (i = 0; i < cliArgs.file.length; i++) {
				testFileArray = testFiles.filter(closure(i));
				if (testFileArray.length === 1) {
					returnTestFiles = returnTestFiles.concat(testFileArray);
					removeIndex = testFiles.indexOf(testFileArray[0]);
					if (removeIndex !== -1) {
						testFiles.splice(removeIndex, 1);
					}
				} else {
					console.log(colors.yellow('File not Found - ' + cliArgs.file[i]));
				}
			}
		}
		if (!(returnTestFiles.length <= 0 && !(cliArgs.file))) {
			return returnTestFiles;
		}
	} catch (err) {
		console.log(colors.red(err));
	}
	return testFiles;
}

function parseDnrcCLI(dnrc) {
	'use strict';

	try {
		var cliArgs = parser.parseArgs();
		if (cliArgs.doNotRunCoverage) {
			return (cliArgs.doNotRunCoverage.toString().toUpperCase() === 'TRUE') ? true : false;
		}
	} catch (err) {
		console.log(colors.red(err));
	}
	return dnrc;
}

if (module && module.exports) {
	module.exports.parseTestFilesCLI = parseTestFilesCLI;
	module.exports.parseDnrcCLI = parseDnrcCLI;
}
