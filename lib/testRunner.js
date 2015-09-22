/*
 * Start of the program
 */

/*jslint node:true */

var server = require('./server/server');
var parser = require('./parser/parseNWTestConfig');
var cliReader = require('./parser/cliReader');
var colors = require('colors');

function testRunner() {
    'use strict';

    var configObj = {};

    try {
        // Parse the config file
        configObj = parser.parseConfig();
        if (configObj) {

            if (configObj.test) {
                // Parse CLI arguments to get test files, if any
                configObj.test = cliReader.parseTestFilesCLI(configObj.test);
            } else {
                console.error(colors.red('Test files to execute should be mentioned in config file'));
                return;
            }

            // Parse CLI arguments to get doNotRunCoverage, if any
            configObj.doNotRunCoverage = cliReader.parseDnrcCLI(configObj.doNotRunCoverage);

            // Initialize server side variables
            server.initValues(configObj);
            // Start the server
            server.startServer();
            // Start running the test
            if (configObj.test && configObj.test.length > 0) {
                server.runTest(0);
            } else if (configObj.src && configObj.src.length > 0 && !configObj.doNotRunCoverage) {
                server.runTest(0, true);
            } else {
                console.error(colors.red('No files to execute'));
                return;
            }
        }
    } catch (err) {
        console.error(colors.red(err));
    }
}

if (module && module.exports) {
    module.exports.testRunner = testRunner;
}
