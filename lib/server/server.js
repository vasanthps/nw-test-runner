/*
 *
 */

/*jslint plusplus: true */
/*jslint node:true */

var colors = require('colors'),
	istanbul = require('istanbul'),
	collector = new istanbul.Collector(),
	reporter = new istanbul.Reporter(),
	cp = require('child_process'),
	fs = require('fs'),
	path = require('path'),
	q = require('q'),
	utils = require('./utils');

var errorCb,
	successCb,
	configData,
	testData,
	isAllSrcFilesRun,
	i,
	j;

function initValues(configObj) {
	'use strict';
	configData = configObj;
	reporter.addAll(configObj.covReport);
	isAllSrcFilesRun = false;
	i = 0;
	j = 0;
}

function runTest(index, runSourceFiles) {
	'use strict';

	var defer = q.defer(),
		file,
		basename,
		srcFileName,
		mockFileName,
		depsFileName,
		outputFilename,
		srcFile,
		mockFile,
		depFile,
		addlFiles,
		list,
		filePath,
		item,
		filem,
		filed,
		filesr,
		execCmd,
		child,
		closure;

	closure = function () {
		return function (f) {
			list.push(path.resolve(f));
		};
	};

	testData = {};
	testData.outputFolder = configData.output;

	if (runSourceFiles) {
		testData.src = [configData.src[index]];
		testData.outputFileName = path.basename(testData.src);
		console.log("Running coverage for untested file: " + colors.yellow(testData.outputFileName));

	} else {


		file = configData.test[index];
		//Now pick a test file and find the corresponding mock and src file
		basename = path.basename(file);
		srcFileName = utils.getBaseName(basename, configData.ext) + '.js';
		mockFileName = utils.getBaseName(basename, configData.ext) + '.mock.js';
		depsFileName = utils.getBaseName(basename, configData.ext) + '.deps.js';
		outputFilename = utils.getBaseName(basename, configData.ext) + '.result.xml';
		srcFile = undefined;
		mockFile = undefined;
		depFile = undefined;
		addlFiles = undefined;
		list = [];
		filePath = utils.getRelativeDirPath(configData.testFolder, file);
		outputFilename = utils.getOutputFileName(filePath, outputFilename);
		testData.outputFileName = outputFilename;

		if (configData.files) {
			if (Array.isArray(configData.files)) {
				configData.files.forEach(function (f) {
					list.push(path.resolve(f));
				});
			} else {
				list.push(path.resolve(configData.files));
			}

			testData.files = list;
		}

		if (configData.mock) {
			list = [];
			for (item in configData.mock) {
				if (configData.mock.hasOwnProperty(item)) {
					filem = configData.mock[item];
					if (utils.checkFileRelativePath(filem, filePath, mockFileName)) {
						mockFile = filem;
						list.push(path.resolve(filem));
						break;
					}
				}
			}
			testData.mock = list;
		}


		if (configData.deps) {
			list = [];
			for (item in configData.deps) {
				if (configData.deps.hasOwnProperty(item)) {
					filed = configData.deps[item];
					if (utils.checkFileRelativePath(filed, filePath, depsFileName)) {
						depFile = filed;
						try {
							addlFiles = require(path.resolve(filed));
						} catch (e) {
							//Ignore as of now
						}
						addlFiles.forEach(closure());

						break;
					}
				}
			}
			testData.deps = list;
		}

		if (configData.src) {
			list = [];
			for (item in configData.src) {
				if (configData.src.hasOwnProperty(item)) {
					filesr = configData.src[item];
					if (utils.checkFileRelativePath(filesr, filePath, srcFileName)) {
						configData.src.splice(item, 1);
						srcFile = filesr;
						list.push(filesr);
						break;
					}
				}
			}
			testData.src = list;
		}

		//Push the test file atlast
		testData.test = [path.resolve(file)];

		console.log("Running " + basename + " tests...");
	}

	if (testData.src.length > 0) {
		try {
			execCmd = '"' + configData.nwPath + '" ./node_modules/nw-test-runner/lib/client/ ' + configData.port;
			child = cp.exec(execCmd, function (err, done) {
				if (err) {
					defer.reject(err);
				} else {
					defer.resolve(true);
				}

			});

			//Add an error check
		} catch (exp) {
			console.log(exp);
			defer.reject(exp);
		}
	} else {
		defer.reject('Source File is not found');
	}

	return defer.promise;
}

successCb = function () {
	'use strict';
	i++;
	if (i < configData.test.length) {
		runTest(i).then(undefined, errorCb);
	} else if (!isAllSrcFilesRun) {
		if (j < configData.src.length && !configData.ignoreCoverageForUntested) {
			runTest(j, true).then(undefined, errorCb);
			j++;
		} else {
			isAllSrcFilesRun = true;
			console.log("All tests done!");
			reporter.write(collector, true, function () {
				console.log(colors.green('All reports generated'));
				console.log("Cleaning up temp files...");
				try {
					fs.unlinkSync('temp.json');
				} catch (exp) {
					//probably file didnt exist
				}
				console.log(colors.green("done"));
				process.exit(0);
			});
		}


	}
};

errorCb = function (err) {
	'use strict';
	console.log(colors.red("Running test failed with error:- " + err));
	setTimeout(successCb, 500);
};

function serverCB(socket) {
	'use strict';

	socket.write(JSON.stringify(testData));
	socket.on('data', function (data) {
		var pdata = JSON.parse(data);
		if (typeof pdata.fail !== 'undefined') {
			if (pdata.fail === 0) {
				console.log(colors.green(pdata.fail + " tests failed"));
			} else {
				console.log(colors.red(pdata.fail + " tests failed"));
			}
			try {
				collector.add(JSON.parse(fs.readFileSync('temp.json', 'utf8')));
			} catch (exp) {
				console.log(colors.red("Adding to collector failed"));
			}

			setTimeout(successCb, 500);
		}
		if (pdata.coverage) {
			collector.add(data.coverage);
		}
		if (pdata.log) {
			console.log(data.log);
		}

	});
}

function startServer() {
	'use strict';

	var net = require('net'),
		HOST = '127.0.0.1',
		PORT = configData.port;

	// Create a server instance, and chain the listen function to it
	// The function passed to net.createServer() becomes the event handler for the 'connection' event
	// The sock object the callback function receives UNIQUE for each connection
	net.createServer(function (sock) {
		setTimeout(function () {
			serverCB(sock);
		}, 500);

	}).listen(PORT, HOST);

	console.log('Server listening on ' + HOST + ':' + PORT);
}

if (module && module.exports) {
	module.exports.startServer = startServer;
	module.exports.initValues = initValues;
	module.exports.runTest = runTest;
}
