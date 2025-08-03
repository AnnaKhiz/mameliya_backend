let knexLib = require('knex');
const knexConfig = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);
const { v4 : uuidv4 } = require('uuid');
const { generateJWt, hashPass, checkPass } = require('../utils/authEncoding');
const isProd = process.env.NODE_ENV === 'production';
const { groupByPrefixes } = require('../utils/groupByPrefixes');
const logger = require('../utils/logger')('auth-user');
async function signUpUser(req, res, next) {
	const { body: user } = req;

	const { email, password } = user;

	if (!email || !password) {
		logger.info(`${req.method} ${req.url} 400 Empty fields`);
		return res.status(400).send({
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
		const mamaInfo = {
			mood: 'happy',
			hasRituals: false,
			isTimerUsed: false,
			timer: 5,
			userId: result[0].userId
		}
		await knex('mama_about').insert(mamaInfo).returning('*');

		req._auth = { role: 'user', userId: result[0].userId };
		const token = generateJWt(req._auth);

		setCookie(res, token);
		delete result[0].password;

		logger.info(`[${req.method}] ${req.url} 200 Signed up successful`);

		return res.status(200).send({
			result: true,
			data: result[0],
			code: 200,
			message: 'Successful'
		});
	} catch (error) {
		if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
			logger.info(`[${req.method}] ${req.url} 409 Email is already exist`);
			return res.status(409).send({
				result: false,
				data: null,
				code: 409,
				message: 'Email conflict'
			})
		} else {
			logger.info(`[${req.method}] ${req.url} 500 Error message: ${error}`);
			console.log('Error [SIGN UP USER]: ', error)
		}
	}
}

async function signInUser(req, res, next) {
	const { email, password } = req.body;

	if (!email || !password) {
		logger.info(`${req.method} ${req.url} 400 Empty fields`);
		return res.status(400).send({
			result: false,
			data: null,
			code: 400,
			message: 'Empty fields'
		})
	}

	try {
		const user = await knex('users')
			.leftJoin('mama_about', 'users.userId', 'mama_about.userId')
			.select('users.*',
				'mama_about.mood as mama_mood',
				'mama_about.hasRituals as mama_hasRituals',
				'mama_about.isTimerUsed as mama_isTimerUsed',
				'mama_about.timer as mama_timer')
			.where({ email } )
			.first();

		if (!user) {
			logger.info(`${req.method} ${req.url} 400 User email is incorrect`);
			return res.status(400).send({
				result: false,
				data: null,
				code: 400,
				message: 'Wrong email'
			})
		}
		const isPasswordEqual = await checkPass(password, user.password);

		if (!isPasswordEqual) {
			logger.info(`${req.method} ${req.url} 400 User password is incorrect`);
			return res.status(400).send({
				result: false,
				data: null,
				code: 400,
				message: 'Wrong password'
			})
		}

		req._auth = { role: 'user', userId: user.userId };
		const token = generateJWt(req._auth);

		setCookie(res, token);

		delete user.password;

		logger.info(`${req.method} ${req.url} 200 Sign in successful`);
		return res.status(200).send({
			result: true,
			data: groupByPrefixes(['mama'], user),
			code: 200,
			message: 'Successful'
		});
	} catch (error) {
		logger.info(`${req.method} ${req.url} 500 Error message: ${error}`);
		console.log('Error [SIGN IN USER]: ', error)
	}
}

function logOutUser(req, res, next) {
	clearCookie(res);
	logger.info(`${req.method} ${req.url} 200 User logged out`);
	res.send({ result: true });
	next();
}

async function checkIsTokenExpired(req, res, next) {
	const { userId } = req._auth;

	if (!userId) {
		logger.info(`${req.method} ${req.url} 401 Token expired! Access denied!`);
		return res.status(401).send({ result: false, message: 'Access denied', data: null});
	}

	try {
		const user = await knex('users')
			.leftJoin('mama_about', 'users.userId', 'mama_about.userId')
			.leftJoin('mama_diary', 'users.userId', 'mama_diary.created_at')
			.select('users.*',
				'mama_about.mood as mama_mood',
				'mama_about.hasRituals as mama_hasRituals',
				'mama_about.isTimerUsed as mama_isTimerUsed',
				'mama_about.timer as mama_timer',
				'mama_diary.title as diary_title',
				'mama_diary.description as diary_description',
				'mama_diary.created_at as diary_created_at'
				)
			.where('users.userId', userId )
			.first();

		delete user.password;

		logger.info(`${req.method} ${req.url} 200 User authorized`);
		return res.status(200).send({ result: true, message: 'User authorized', data: groupByPrefixes(['mama', 'diary'], user) });
	} catch(error) {
		console.log('Error [checkIsTokenExpired]:', error);
		clearCookie(res);
		logger.info(`${req.method} ${req.url} 500 Error message: ${error}`);
		return res.status(401).send({ result: false, message: 'Token expired', data: null});
	}
}

async function checkIsPasswordCorrect(req, res, next) {
	const { userId } = req._auth;
	const { password } = req.body;

	try {
		if (!password) {
			logger.info(`${req.method} ${req.url} 400 Password field is empty`);
			return res.status(400).send({
				result: false,
				data: null,
				code: 400,
				message: 'Empty field'
			})
		}

		const user = await knex('users').where({ userId }).first();

		if (!user) {
			logger.info(`${req.method} ${req.url} 400 User did not found`);
			return res.status(400).send({
				result: false,
				data: null,
				code: 400,
				message: 'No user'
			})
		}
		const isPasswordEqual = await checkPass(password, user.password);

		if (!isPasswordEqual) {
			logger.info(`${req.method} ${req.url} 400 Password is incorrect`);
			return res.status(400).send({
				result: false,
				data: null,
				code: 400,
				message: 'Wrong password'
			})
		}

		logger.info(`${req.method} ${req.url} 200 Password correct`);
		return res.status(200).send({
			result: true,
			data: [],
			code: 200,
			message: 'Password correct'
		});


	} catch (error) {
		console.log('Error [CHECK PASS]: ', error);
		logger.info(`${req.method} ${req.url} 500 Error message: ${error}`);
		return res.status(500).send({
			result: false,
			data: null,
			code: 500,
			message: 'Request [CHECK PASS] error'
		})
	}
}

// HELPERS
function setCookie(res, token) {
	logger.info(`[SET COOKIES] token 200`);
	res.cookie('token', token, {
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? 'None' : 'Lax',
		path: '/user',
		expires: new Date(Date.now() + 86400000)
	});
}
function clearCookie(res) {
	logger.info(`[CLEAR COOKIES] token 200`);
	res.clearCookie('token', {
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? 'None' : 'Lax',
		path: '/user',
	});
}


module.exports = {
	signInUser,
	signUpUser,
	logOutUser,
	checkIsTokenExpired,
	checkIsPasswordCorrect
}
