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
	packageJSONPath = path.join(__dirname, '../../', './package.json'),
    version = require(packageJSONPath).version,
    args = {};

/*
 * CLI arguments
 */

args.file = {};
args.file.name = ['-f', '--file'];
args.file.options = {
    help: ''
};
args.module = {};
args.module.name = ['-m', '--module'];
args.module.options = {
    help: ''
};
args.fileArray = {};
args.fileArray.name = ['-fa', '--fileArray'];
args.fileArray.options = {
    help: ''
};
args.doNotRunCoverage = {};
args.doNotRunCoverage.name = ['-d', '--doNotRunCoverage'];
args.doNotRunCoverage.options = {
    help: ''
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

var cliArgs = parser.parseArgs();

function parseTestFilesCLI(testFiles) {
    'use strict';
    try {
        var i = 0,
            returnTestFiles = [],
            testFileArray,
            closure;

        closure = function (index) {
            return function (item) {
                return item.indexOf(cliArgs.fileArray[index]) !== -1;
            };
        };

        if (cliArgs.module) {
            cliArgs.module = path.sep + path.normalize(cliArgs.module) + path.sep;
            testFiles = testFiles.filter(function (item) {
                return item.indexOf(cliArgs.module) !== -1;
            });
        }
        if (cliArgs.file) {
            cliArgs.file = path.sep + path.normalize(cliArgs.file);
            testFileArray = testFiles.filter(function (item) {
                return item.indexOf(cliArgs.file) !== -1;
            });
            returnTestFiles = returnTestFiles.concat(testFileArray);
        }
        if (cliArgs.fileArray) {
            //console.log(cliArgs.fileArray);
            cliArgs.fileArray = cliArgs.fileArray.split(',');
            for (i = 0; i < cliArgs.fileArray.length; i++) {
                cliArgs.fileArray[i] = path.sep + path.normalize(cliArgs.fileArray[i]);
                testFileArray = testFiles.filter(closure(i));
                returnTestFiles = returnTestFiles.concat(testFileArray);
            }
        }
        if (returnTestFiles.length > 0) {
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
        if (cliArgs.doNotRunCoverage !== undefined) {
            return cliArgs.doNotRunCoverage;
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
