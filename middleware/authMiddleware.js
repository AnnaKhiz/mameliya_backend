const { jwtKey } = require('config');
const { verifyJwt } = require('../utils/authEncoding');
const logger = require('../utils/logger')('auth-middleware');

function parserJwt(req, res, next) {
	const { token } = req.cookies;

	if (token) {
		const payload = verifyJwt(token, jwtKey);
		req._auth = payload;
		logger.info(`${req.method} ${req.url} 200 JWT verified, added _auth info`);
	} else {
		req._auth = {};
		logger.info(`${req.method} ${req.url} 200 JWT not verified, _auth info = {}`);
	}
	next();
}

module.exports = { parserJwt };
