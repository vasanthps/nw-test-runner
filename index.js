var mocha = require('mocha');
	glob = require('glob'),
 	cp = require('child_process'),
 	fs = require('fs'),
 	path = require('path');


function run() {
	var args = process.argv;
	var config = "nwtest.config.json";


	if(fs.existsSync(config)) {
		console.log("Found the " + config + " file");
	} else {
		console.log("nw-test-runner needs the config file to be present in the directory in which tests are executed. Please see readme for more details");
		return;
	}
	//This check not needed
	if(config) {
		try {
			var aconf = path.resolve(config);
			var opts = require(aconf);
			
			if(opts.src) {
				var src = glob.sync(opts.src);
			}
			if(opts.mock) {
				var mock = glob.sync(opts.mock);
			}
			if(opts.test) {
				var test = glob.sync(opts.test);
			}
			for(var k in test) {
				var file = test[k];

				//Now pick a test file and find the corresponding mock and src file
				var basename = path.basename(file);
				var srcFileName = getBaseName(basename) + '.js';
				var mockFileName = getBaseName(basename) + '.mock.js';
				var outputFilename = getBaseName(basename) + '.result.xml';
				var srcFile, mockFile, list = [];
				
				if(opts.files) {
					if(Array.isArray(opts.files)) {
						opts.files.forEach(function(f) {
							list.push(path.resolve(f));
						})
					} else {
						list.push(path.resolve(opts.files));
					}
				}

				for(var i in mock) {
					var filem = mock[i];
					if(filem.indexOf(mockFileName) > -1) {
						mockFile = filem;
						list.push(path.resolve(filem));
						break;
					}
				}

				for(var i in src) {
					var filesr = src[i];
					if(filesr.indexOf(srcFileName) > -1) {
						srcFile = filesr;
						list.push(path.resolve(filesr));
						break;
					}
				}

				//Push the test file atlast
				list.push(path.resolve(file));

				var output_folder = "";
				var fse = require('fs-extra');
				if(!opts.output) {

					output_folder = "nwtest_results";

				} else {
					output_folder = opts.output;
				}
				//fse.removeSync(output_folder);
				fse.ensureDirSync(output_folder);
				console.log("Running " + basename + " tests...");
				try {
					
					var ls = cp.execSync('"node_modules/nodewebkit/nodewebkit/nw" ./node_modules/nw-test-runner/lib/ ' + list + ' ' + output_folder + ' ' + outputFilename);
					
					//Add an error check
				} catch(exp) {
					console.log(exp);
				}
			}
			
		} catch(exp) {
			
			console.log(exp);
		}
		

	} else {

	}
}

function getBaseName(filename) {
	var name = filename.split('.test');
	return name[0];
}

run();
module.exports = run;