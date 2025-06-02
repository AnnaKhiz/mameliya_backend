let knexLib = require('knex');
const knexConfig = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);
const { v4 : uuidv4 } = require('uuid');
const { generateJWt, hashPass } = require('../utils/authEncoding');
const isProd = process.env.NODE_ENV === 'production';
async function signInUser(req, res, next) {
	const { body: user } = req;

	const { email, password } = user;

	if (!email || !password) {
		res.status(400).send({
			result: false,
			data: null,
			code: 400,
			message: 'Empty fields'
		})
	}
	user.userId = uuidv4();
	user.password = await hashPass(user.password);

	try {
		const result = await knex('users').insert(user).returning('*');
		console.log(result);

		req._auth = { role: 'user', userId: result[0].userId };
		const token = generateJWt(req._auth);

		res.cookie('token', token, {
			httpOnly: true,
			secure: isProd,
			sameSite: isProd ? 'None' : 'Lax',
			path: '/user',
			expires: new Date(Date.now() + 86400000)
		});

		res.status(200).send({
			result: true,
			data: result[0],
			code: 200,
			message: 'Successful'
		});
	} catch (error) {
		if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
			res.status(409).send({
				result: false,
				data: null,
				code: 409,
				message: 'Email conflict'
			})
		} else {
			console.log('Error [SIGN UP USER]: ', error)
		}
	}

}

module.exports = {
	signInUser
}
