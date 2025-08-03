const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { jwtKey, jwtExpires } = require('config');
const logger = require('../utils/logger')('auth-encoding');

function generateJWt(payload) {
	return jwt.sign(payload, jwtKey, { expiresIn: jwtExpires });
}

function verifyJwt(token, secret) {
	try {
		const result = jwt.verify(token, secret);
		logger.info(`[JWT] verified successfully`);
		return result;
	} catch (error) {
		console.log(error);
		logger.info(`[JWT] not verified. Message error: ${error}`);
		return null;
	}
}

async function hashPass(textPass) {
	const salt = await bcrypt.genSalt(10);
	const hashedPass = await bcrypt.hash(textPass, salt);
	return hashedPass;
}


async function checkPass(textPass, hashedPass) {
	try {
		logger.info(`[CHECK PASS] passwords are checked successfully`);
		return !!(await bcrypt.compare(textPass, hashedPass));
	} catch (error) {
		logger.info(`[CHECK PASS] passwords are different. Message error: ${error}`);
		return false;
	}
}

module.exports = {
	hashPass,
	checkPass,
	generateJWt,
	verifyJwt
};
