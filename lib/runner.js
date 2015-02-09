$(function () {
    
    var Mocha = require('mocha');
	var chai = require('chai');
    var path  = require('path');
    var gui = require('nw.gui');
    
    //Get the command line params
    var files = gui.App.argv[0].split(',');
    var outputFolder = gui.App.argv[1];
	var outputFileName = gui.App.argv[2];

    //Switch to dir where the tests are executed
    process.chdir('../../../');

    var mocha = new Mocha({
        ui: 'bdd',
        reporter: 'xunit',
		reporterOptions: {
			output: path.resolve(path.join(outputFolder, outputFileName))
		}
    });
	
    //Make mocha and chai available globally
	window.mocha = mocha;
	window.expect = chai.expect;

    // pass the browser context
   mocha.suite.emit('pre-require', window, null, mocha);

    

    files.forEach(function (file) {
        // Instead of using mocha's "addFile"
        $('head').append('<script src="'+file+'"></script>');
    });

    // Now, you can run the tests.
    mocha.run(function (failures) {
        require('nw.gui').Window.get().close(); //Close the app
    });
});