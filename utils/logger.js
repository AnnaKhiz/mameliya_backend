const fs = require('fs');
const path = require('path');

function checkDirectory() {
	fs.mkdir(path.join('.', 'logs'), (error) => {
		if (error && error.code === 'EEXIST') {
			console.log('Directory already exist');
		} else if (error) {
			console.log(error);
		}
	})
}

checkDirectory();

const writeStreamInfo = fs.createWriteStream(path.join('.', 'logs', 'info.log'), { encoding: 'utf8', flags: 'a' });

const logger = (param) => {
	return {
		info: (...args) => {
			const now = new Date();
			writeStreamInfo.write(`${now.toLocaleString()} - [${param.toUpperCase()}]: ${args}\n`)
		}
	}
}

process.on('beforeExit', () => {
	writeStreamInfo.end();
})


module.exports = logger
