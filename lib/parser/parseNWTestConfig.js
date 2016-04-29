/*
 * Parses nwtest.config.json file
 */

/*jslint node:true */

var glob = require('glob-array'),
    fs = require('fs'),
    path = require('path'),
    colors = require('colors'),
    defaultValues = require('./defaultValues.json');


function getFiles(pattern) {
    'use strict';

    if (typeof pattern === 'string') {
        return glob.sync([pattern]);
    } else if (Array.isArray(pattern)) {
        return glob.sync(pattern);
    } else {
        return [];
    }
}

function parseConfig() {
    'use strict';

    try {
        var configFileExists = fs.existsSync(defaultValues.config),
            configPath = path.resolve(defaultValues.config),
            data = require(configPath),
            fse = require('fs-extra'),
            configObj = {},
            key;

        if (configFileExists) {
            console.log('Found the ' + defaultValues.config + ' file');
        } else {
            console.log(colors.red('nwjs-test-runner needs the config file to be present in the directory in which tests are executed. Please see readme for more details'));
            return;
        }

        /*
         * Load default values to Test Configuration object
         */

        for (key in defaultValues) {
            if (defaultValues.hasOwnProperty(key)) {
                configObj[key] = defaultValues[key];
            }
        }


        /*
         * Parse nwtest.config.json file
         */

        configObj.files = data.files;
        configObj.src = getFiles(data.src);
        configObj.mock = getFiles(data.mock);
        configObj.deps = getFiles(data.deps);
        if (data.test) {
            configObj.test = getFiles(data.test);
        } else {
            console.log(colors.red('Test files to execute should be mentioned in config file'));
            return;
        }
        if (data.ignoreCoverageForUntested !== undefined) {
            configObj.ignoreCoverageForUntested = data.ignoreCoverageForUntested;
        }
        if (data.port) {
            configObj.port = parseInt(data.port, 10);
        }
        if (data.output && typeof data.output !== 'string') {
            console.log(colors.red('Output folder must be a string. Using default output folder:- ' + configObj.output));
        } else if (data.output) {
            configObj.output = data.output;
        }
        fse.ensureDirSync(configObj.output);
        if (!data.nwpath) {
            console.log(colors.red('Please specify nwpath param in config file'));
            return;
        } else {
            configObj.nwPath = data.nwpath;
        }
        if (data.testFolder && typeof data.testFolder !== 'string') {
            console.log(colors.red('Test Folder must be a string'));
        } else if (data.testFolder) {
            configObj.testFolder = data.testFolder;
        }
        if (data.covReport && typeof data.covReport === 'string') {
            configObj.covReport = [data.covReport];
        } else if (data.covReport && Array.isArray(data.covReport)) {
            configObj.covReport = data.covReport;
        }

        return configObj;

    } catch (err) {
        console.log(colors.red(err));
        return;
    }
}

if (module && module.exports) {
    module.exports.parseConfig = parseConfig;
}
