//require('nw.gui').Window.get().showDevTools();
(function () {

    var Mocha = require('mocha');
    var chai = require('chai');
    var path = require('path');
    var gui = require('nw.gui');
    var istanbul = require('istanbul');

    var fs = require('fs'),
        q = require('q');
    var path = require('path');
    //Get the command line params
    var port = gui.App.argv[0];

    //Switch to dir where the tests are executed
    process.chdir('../../../');


    startClient(port).then(function (data) {
        var client = data.obj;
        var test = data.testData;

        //logErrHandler(client);

        var mocha = new Mocha({
            ui: 'bdd',
            reporter: 'xunit',
            reporterOptions: {
                output: path.resolve(path.join(test.outputFolder, test.outputFileName))
            }
        });

        //Make mocha and chai available globally
        window.mocha = mocha;
        window.expect = chai.expect;
        window.assert = chai.assert;

        // pass the browser context
        mocha.suite.emit('pre-require', window, null, mocha);

        if (test.files) {
            test.files.forEach(function (f) {
                appendScript(f);
            })
        }

        if (test.mock) {
            test.mock.forEach(function (f) {
                appendScript(f);
            })
        }

        if (test.deps) {
            test.deps.forEach(function (f) {
                appendScript(f);
            })
        }
        if (test.src) {
            var codeToInstrument = "";
            var instrumenter = new istanbul.Instrumenter({});
            test.src.forEach(function (file) {
                codeToInstrument += fs.readFileSync(file, 'utf8');
            });
            var basename = "";
            basename = test.src[0];
            var cov = instrumenter.instrumentSync(codeToInstrument, basename);
            try {
                appendScript(cov, true);
            } catch (exp) {
                //IGNORE- SCRIPT EXEC FAILED
            }
        }
        if (test.test) {
            test.test.forEach(function (f) {
                appendScript(f);
            })

            mocha.run(function (failures) {

                fs.writeFileSync('temp.json', JSON.stringify(window.__coverage__));
                client.write(JSON.stringify({
                    fail: failures
                }));

                client.destroy();

                require('nw.gui').Window.get().close(); //Close the app
            });
        } else {

            if (window.__coverage__)
                fs.writeFileSync('temp.json', JSON.stringify(window.__coverage__));
            client.write(JSON.stringify({
                fail: 0
            }));
            client.destroy();
            process.exit(0) //Close the app
        }







    });

    function startClient(port) {
        var defered = q.defer();
        var net = require('net');

        var HOST = '127.0.0.1';
        var PORT = port;

        var client = new net.Socket();
        client.connect(PORT, HOST, function () {
            console.log("connected with port");
        });
        client.on('data', function (data) {
            defered.resolve({
                obj: client,
                testData: JSON.parse(data)
            });
        })

        return defered.promise;
    };

    function appendScript(include, isInstrumented) {
        if (isInstrumented) {
            $('head').append('<script>' + include + '</script>');
        } else {
            $('head').append('<script src="' + include + '"></script>');
        }
    }

    function logErrHandler(client) {
        //Pass the console logs to runner
        console.log = function (str) {
            client.write(JSON.stringify({
                log: str
            }));
        };

        //Watch for exceptions and handle
        process.on('uncaughtException', function (err) {
            console.log('Uncaught Exception: ' + err);
            process.exit(-1);
        });

        window.on('error', function (err) {
            console.log('Uncaught error: ' + err);
            process.exit(-1);
        });

    }


})();
