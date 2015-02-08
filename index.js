var mocha = require('mocha');
	glob = require('glob'),
 	cp = require('child_process'),
 	fs = require('fs'),
 	path = require('path');


function run() {
	var args = process.argv;
	var config = args[2];

	if(config) {
		try {
			var opts = require(config);
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
				var srcFile, mockFile, list = [];
				console.log(basename);
				console.log(src);
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

				
				list.push(path.resolve(file));
				
				try {
					
					var ls = cp.exec('"node_modules/nodewebkit/nodewebkit/nw" ./lib/ ' + list);
					//var ls = cp.execFile('nw.sh');
					//var ls = cp.spawn('ls');

					ls.stdout.on('data', function (data) {
					  console.log('stdout: ' + data);
					});

					ls.stderr.on('data', function (data) {
					  console.log('stderr: ' + data);
					});

					ls.on('close', function (code) {
					  console.log('child process exited with code ' + code);
					});
				} catch(exp) {
					console.log(exp);
				}

				break;
			}
			
		} catch(exp) {
			//Not a json file
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