/*
 *
 */

/*jslint plusplus: true */
/*jslint node:true */

var path = require('path');

function getBaseName(filename, ext) {
	'use strict';
	var name = filename.split('.' + ext);
	return name[0];
}

function getRelativeDirPath(testFolder, file) {
	'use strict';

	var dirPath,
		dirName;
	try {
		if (testFolder) {
			dirName = path.dirname(file);
			dirPath = path.relative(testFolder, dirName);
		}
	} catch (err) {
		console.log(err);
	}
	return dirPath;
}

function checkFileRelativePath(filePath, searchFilePath, fileName) {
	'use strict';

	var pathToMatch = [],
		pathToCheck = [],
		i = 0;

	if (searchFilePath) {
		pathToMatch = searchFilePath.split(path.sep);
	}

	filePath = path.resolve(filePath);
	pathToCheck = filePath.split(path.sep).reverse();
	pathToMatch.push(fileName);
	pathToMatch.reverse();

	try {
		for (i = 0; i < pathToMatch.length; i++) {
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

if (module && module.exports) {
	module.exports.getBaseName = getBaseName;
	module.exports.getRelativeDirPath = getRelativeDirPath;
	module.exports.checkFileRelativePath = checkFileRelativePath;
}