var mocha = require('mocha');
glob = require('glob-array'),
    cp = require('child_process'),
    fs = require('fs'),
    path = require('path'),
    q = require('q');

var colors = require('colors'),
    istanbul = require('istanbul'),
    collector = new istanbul.Collector(),
    reporter = new istanbul.Reporter(),
    sync = false;

(function () {
    var args = process.argv,
        config = "nwtest.config.json";

    if (fs.existsSync(config)) {
        console.log("Found the " + config + " file");
    } else {
        console.log(colors.red("nw-test-runner needs the config file to be present in the directory in which tests are executed. Please see readme for more details"));
        return;
    }

    try {
        var aconf = path.resolve(config),
            opts = require(aconf),
            fse = require('fs-extra'),
            output_folder = "",
            testFolder = "",
            nw_path = "",
            i = 0,
            j = 0,
            src,
            mock,
            deps,
            test,
            sock,
            testData,
            isAllSrcFilesRun = false;

        src = getFiles(opts.src);
        mock = getFiles(opts.mock);
        deps = getFiles(opts.deps);

        if (opts.test) {
            test = getFiles(opts.test);
            if (process.argv[2]) {
                test = test.filter(function (item) {
                    return item.indexOf(process.argv[2]) != -1;
                });
            }
        } else {
            console.log(colors.red("Test files to execute should be mentioned in config file"));
            process.exit(0);
        }

        if (!opts.port) {
            opts.port = 3232;
        } else {
            opts.port = parseInt(opts.port);
        }

        if (!opts.output) {
            output_folder = "nwtest_results";

        } else if (typeof opts.output !== 'string') {
            output_folder = "nwtest_results";
            console.log(colors.red("Output folder must be a string. Using default output folder:- " + output_folder));
        } else {
            output_folder = opts.output;
        }
        fse.ensureDirSync(output_folder);

        //Now get the node path
        if (!opts.nwpath) {
            console.log(colors.red("Please specify nwpath param in config file"));
            return;
        } else {
            nw_path = opts.nwpath;
        }

        // Get test folder path
        if (!opts.testFolder) {} else if (typeof opts.testFolder !== 'string') {
            console.log(colors.red("Absolute path must be a string"));
        } else {
            testFolder = opts.testFolder;
        }

        var serverCB = function (s) {
            sock = s;
            sock.write(JSON.stringify(testData));
            sock.on('data', function (data) {
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
        };

        startServer(opts.port, serverCB);

        if (typeof opts.covReport === 'string') {
            reporter.addAll([opts.covReport]);
        } else if (Array.isArray(opts.covReport)) {
            reporter.addAll(opts.covReport);
        } else {
            reporter.addAll(['cobertura', 'html']);
        }

        var runTest = function (index, runSourceFiles) {

            var defer = q.defer();

            var ext = "test";

            if (opts.ext) {
                ext = opts.ext;
            }

            testData = {};
            testData.outputFolder = output_folder;

            if (runSourceFiles) {
                testData.src = [src[index]];
                testData.outputFileName = path.basename(testData.src);
                console.log("Running coverage for untested file: " + colors.yellow(testData.outputFileName));

            } else {


                var file = test[index];
                //Now pick a test file and find the corresponding mock and src file
                var basename = path.basename(file);
                var srcFileName = getBaseName(basename, ext) + '.js';
                var mockFileName = getBaseName(basename, ext) + '.mock.js';
                var depsFileName = getBaseName(basename, ext) + '.deps.js';
                var outputFilename = getBaseName(basename, ext) + '.result.xml';
                var srcFile, mockFile, depFile, addlFiles, list = [];

                var filePath = getRelativeDirPath(testFolder, file);

                testData.outputFileName = outputFilename;

                if (opts.files) {
                    if (Array.isArray(opts.files)) {
                        opts.files.forEach(function (f) {
                            list.push(path.resolve(f));
                        })
                    } else {
                        list.push(path.resolve(opts.files));
                    }

                    testData.files = list;
                }

                if (opts.mock) {
                    list = [];
                    for (var i in mock) {
                        var filem = mock[i];
                        if (checkFileRelativePath(filem, filePath, mockFileName)) {
                            mockFile = filem;
                            list.push(path.resolve(filem));
                            break;
                        }
                    }
                    testData.mock = list;
                }


                if (opts.deps) {
                    list = [];
                    for (var i in deps) {
                        var filed = deps[i];
                        if (checkFileRelativePath(filed, filePath, depsFileName)) {
                            depFile = filed;
                            try {
                                addlFiles = require(path.resolve(filed));
                            } catch (e) {
                                //Ignore as of now
                            }
                            addlFiles.forEach(function (f) {
                                list.push(path.resolve(f));
                            })

                            break;
                        }
                    }
                    testData.deps = list;
                }

                if (opts.src) {
                    list = [];
                    for (var i in src) {
                        var filesr = src[i];
                        if (checkFileRelativePath(filesr, filePath, srcFileName)) {
                            src.splice(i, 1);
                            srcFile = filesr;
                            list.push(filesr);
                            break;
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
                    var execCmd = '"' + nw_path + '" ./node_modules/nw-test-runner/lib/ ' + opts.port;
                    var child = cp.exec(execCmd, function (err, done) {
                        if (err)
                            defer.reject(err);
                        else
                            defer.resolve(true);
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
        };

        var successCb = function () {
            i++;
            if (i < test.length)
                runTest(i).then(undefined, errorCb);
            else if (!isAllSrcFilesRun) {
                if (j < src.length && !opts.doNotRunCoverage) {
                    runTest(j, true).then(undefined, errorCb);
                    j++;
                } else {
                    isAllSrcFilesRun = true;
                    console.log("All tests done!");
                    reporter.write(collector, true, function () {
                        console.log(colors.green('All reports generated'));
                        console.log("Cleaning up temp files...")
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
        var errorCb = function (err) {
            console.log(colors.red("Running test failed with error:- " + err));
            setTimeout(successCb, 500);
        };

        runTest(i).then(undefined, errorCb);

    } catch (exp) {
        console.log(exp);
    }
})();

function getBaseName(filename, ext) {
    var name = filename.split('.' + ext);
    return name[0];
}

function getRelativeDirPath(testFolder, file) {
    var dirPath = undefined;
    try {
        if (testFolder) {
            var dirName = path.dirname(file);
            dirPath = path.relative(testFolder, dirName);
        }
    } catch (err) {
        console.log(err);
    }
    return dirPath;
}

function checkFileRelativePath(filePath, searchFilePath, fileName) {

    var pathToMatch = [];
    var pathToCheck = [];

    if (searchFilePath) {
        pathToMatch = searchFilePath.split(path.sep);
    }

    filePath = path.resolve(filePath);
    pathToCheck = filePath.split(path.sep).reverse();
    pathToMatch.push(fileName);
    pathToMatch.reverse();

    try {
        for (var i = 0; i < pathToMatch.length; i++) {
            if (pathToMatch[i] !== pathToCheck[i]) {
                return false;
            }
        }
    } catch (err) {
        console.log(err);
        return false;
    }

    return true;
}

function getFiles(pattern) {
    if (typeof pattern === 'string') {
        return glob.sync([pattern]);
    } else if (Array.isArray(pattern)) {
        return glob.sync(pattern);
    } else {
        return [];
    }
}

function startServer(port, cb) {

    var net = require('net');

    var HOST = '127.0.0.1';
    var PORT = port;

    // Create a server instance, and chain the listen function to it
    // The function passed to net.createServer() becomes the event handler for the 'connection' event
    // The sock object the callback function receives UNIQUE for each connection
    net.createServer(function (sock) {
        setTimeout(function () {
            cb(sock);
        }, 500);

    }).listen(PORT, HOST);

    console.log('Server listening on ' + HOST + ':' + PORT);
}
