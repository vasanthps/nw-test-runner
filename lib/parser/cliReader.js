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
	version = require(packageJSONPath).version,
	args = {};

/*
 * CLI arguments
 */

args.directory = {};
args.directory.name = ['-d', '--directory'];
args.directory.options = {
	help: 'Specify the directory and run the unit test only for the source files inside the directory'
};
args.file = {};
args.file.name = ['-f', '--file'];
args.file.options = {
	help: 'Specify a file or a set of files(comma seperated and without white-space) and run the unit test only for the files'
};
args.ignoreCoverageForUntested = {};
args.ignoreCoverageForUntested.name = ['-i', '--ignoreCoverageForUntested'];
args.ignoreCoverageForUntested.options = {
	help: 'Assign true to ignore coverage for source files that have no tests'
};

/* Below options are not required for nwjs-test-runner */
/*args.closeNW = {};
args.closeNW.name = ['-c', '--close'];
args.closeNW.options = {
	help: 'Specify a boolean value to either close or not to close the Node Webkit after completing the unit test. Default is true'
};
args.showNW = {};
args.showNW.name = ['-s', '--show'];
args.showNW.options = {
	help: 'Specify a boolean value to either show or not to show the Node Webkit. Default is false'
};*/

var parser = new ArgumentParser({
	version: version,
	addHelp: true,
	description: ''
});

parser.addArgument(args.directory.name, args.directory.options);
parser.addArgument(args.file.name, args.file.options);
parser.addArgument(args.ignoreCoverageForUntested.name, args.ignoreCoverageForUntested.options);

var cliArgs = parser.parseArgs();

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

		/*if (cliArgs.closeNW) {
		}
		if (cliArgs.showNW) {
		}*/

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

function parseIgnoreCoverageForUntestedCLI(ignoreCoverageForUntested) {
	'use strict';

	try {
		var cliArgs = parser.parseArgs();
		if (cliArgs.ignoreCoverageForUntested) {
			return (cliArgs.ignoreCoverageForUntested.toString().toUpperCase() === 'TRUE') ? true : false;
		}
	} catch (err) {
		console.log(colors.red(err));
	}
	return ignoreCoverageForUntested;
}

if (module && module.exports) {
	module.exports.parseTestFilesCLI = parseTestFilesCLI;
	module.exports.parseIgnoreCoverageForUntestedCLI = parseIgnoreCoverageForUntestedCLI;
}
