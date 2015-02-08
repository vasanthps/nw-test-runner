// show the dev tools by default
require('nw.gui').Window.get().showDevTools().resizeTo(800, 1000);

$(function () {
    // programatically
    var Mocha = require('mocha');

    var mocha = new Mocha({
        ui: 'bdd',
        reporter: 'xunit'
    });
    // pass the browser context
    mocha.suite.emit('pre-require', window, null, mocha);

    var gui = require('nw.gui');
    console.log(gui.App.argv);
    //console.log(process.argv);
    // Then, append your tests
    var files = gui.App.argv[0].split(',');
    console.log(files);
    // Here is an example:
    files.forEach(function (file) {
        console.log(file)
        // Instead of using mocha's "addFile"
        $('head').append('<script src="'+file+'"></script>');
    });

    // Now, you can run the tests.
    mocha.run(function (failures) {
        process.on('exit', function () {
            process.exit(failures);
        });
    });
});