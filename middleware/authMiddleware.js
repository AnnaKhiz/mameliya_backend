const { jwtKey } = require('config');
const { verifyJwt } = require('../utils/authEncoding');

function parserJwt(req, res, next) {
	const { token } = req.cookies;

	if (token) {
		const payload = verifyJwt(token, jwtKey);
		req._auth = payload;
	} else {
		req._auth = {};
	}
	next();
}

module.exports = { parserJwt };
