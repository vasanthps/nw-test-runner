var mocha = require('mocha');
	glob = require('glob'),
 	cp = require('child_process'),
 	fs = require('fs'),
 	path = require('path'),
 	q = require('q');


(function() {
	var args = process.argv,
	    config = "nwtest.config.json";


	if(fs.existsSync(config)) {
		console.log("Found the " + config + " file");
	} else {
		console.log("nw-test-runner needs the config file to be present in the directory in which tests are executed. Please see readme for more details");
		return;
	}

	try {
			var aconf = path.resolve(config), 
				opts = require(aconf),
				fse = require('fs-extra'),
				output_folder = "",
				nw_path = "",
				i = 0,
				src, 
				mock,
				deps,
				test;
			
			if(opts.src) {
				src = glob.sync(opts.src);
			}
			if(opts.mock) {
				mock = glob.sync(opts.mock);
			}
			if(opts.deps) {
				deps = glob.sync(opts.deps);
			}
			if(opts.test) {
				test = glob.sync(opts.test);
			} else { 
				console.log("Test files to execute should be mentioned in config file")
				return;
			}


			
			if(!opts.output) {
				output_folder = "nwtest_results";

			} else {
				output_folder = opts.output;
			}
			fse.ensureDirSync(output_folder);

			//Now get the node path
			if(!opts.nwpath) {
				console.log("Please specify nwpath param in config file");
				return;
			} else {
				nw_path = opts.nwpath;
			}


			var runTest = function(index) {

				var defer = q.defer();

				var file = test[index];

				var ext = "test";

				if(opts.ext) {
					ext = opts.ext;
				}
				//Now pick a test file and find the corresponding mock and src file
				var basename = path.basename(file);
				var srcFileName = getBaseName(basename, ext) + '.js';
				var mockFileName = getBaseName(basename, ext) + '.mock.js';
				var depsFileName = getBaseName(basename, ext) + '.deps.js';
				var outputFilename = getBaseName(basename, ext) + '.result.xml';
				var srcFile, mockFile, depFile, addlFiles, list = [];
				
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

				for(var i in deps) {
					var filed = deps[i];
					if(filed.indexOf(depsFileName) > -1) {
						depFile = filed;
						try {
							addlFiles = require(path.resolve(filed)); 
						} catch(e) {
							//Ignore as of now
						}
						addlFiles.forEach(function(f) {
							list.push(path.resolve(f));
						})
						
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

				console.log("Running " + basename + " tests...");
				try {
					
					var execCmd = '"' + nw_path + '" ./node_modules/nw-test-runner/lib/ ' + list + ' ' + output_folder + ' ' + outputFilename;
					var ls = cp.exec(execCmd, function(err, done) {
						if(err)
							defer.reject(err);
						else
							defer.resolve(true);
					});
					
				//Add an error check
				} catch(exp) {
					console.log(exp);
					defer.reject(exp);
				}

				return defer.promise;
			};

			var successCb = function() {
				i++;
				if(i < test.length)
					runTest(i).then(successCb, errorCb);
				else
					console.log("All tests done!");
			};
			var errorCb = function(err) {
				console.log("Running test failed with error:- " + err);
				successCb();
			};

			runTest(i).then(successCb, errorCb);
			
		} catch(exp) {
			console.log(exp);
		}
})();

function getBaseName(filename, ext) {
	var name = filename.split('.' + ext);
	return name[0];
}

