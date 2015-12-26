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

args.file = {};
args.file.name = ['-f', '--file'];
args.file.options = {
	help: 'Specify the file and run the unit test only for the file'
};
args.module = {};
args.module.name = ['-cwd', '--directory'];
args.module.options = {
	help: 'Specify the directory and run the unit test only for the source files inside the directory'
};
args.fileArray = {};
args.fileArray.name = ['-fa', '--fileArray'];
args.fileArray.options = {
	help: 'Specify a set of files(comma seperated and without white-space) and run the unit test only for the files'
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

parser.addArgument(args.file.name, args.file.options);
parser.addArgument(args.module.name, args.module.options);
parser.addArgument(args.fileArray.name, args.fileArray.options);
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
					cliTestFileArray = path.sep + path.normalize(cliArgs.fileArray[index]);
				return resolvedItem.indexOf(cliTestFileArray) !== -1;
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
		if (cliArgs.module) {
			testFiles = testFiles.filter(function (item) {
				var resolvedItem = path.resolve(item),
					cliModule = path.sep + path.normalize(cliArgs.module) + path.sep;
				return resolvedItem.indexOf(cliModule) !== -1;
			});
		}
		if (cliArgs.file) {
			testFileArray = testFiles.filter(function (item) {
				var resolvedItem = path.resolve(item),
					cliTestFile = path.sep + path.normalize(cliArgs.file);
				return resolvedItem.indexOf(cliTestFile) !== -1;
			});
			if (testFileArray.length === 1) {
				returnTestFiles = returnTestFiles.concat(testFileArray);
				removeIndex = testFiles.indexOf(testFileArray[0]);
				if (removeIndex !== -1) {
					testFiles.splice(removeIndex, 1);
				}
			} else {
				console.log(colors.yellow('File not Found - ' + cliArgs.file));
			}
		}
		if (cliArgs.fileArray) {
			//console.log(cliArgs.fileArray);
			cliArgs.fileArray = cliArgs.fileArray.split(',');
			for (i = 0; i < cliArgs.fileArray.length; i++) {
				testFileArray = testFiles.filter(closure(i));
				if (testFileArray.length === 1) {
					returnTestFiles = returnTestFiles.concat(testFileArray);
					removeIndex = testFiles.indexOf(testFileArray[0]);
					if (removeIndex !== -1) {
						testFiles.splice(removeIndex, 1);
					}
				} else {
					console.log(colors.yellow('File not Found - ' + cliArgs.fileArray[i]));
				}
			}
		}
		if (!(returnTestFiles.length <= 0 && !(cliArgs.file || cliArgs.fileArray))) {
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