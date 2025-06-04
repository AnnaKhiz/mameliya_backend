let knexLib = require('knex');
const knexConfig = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);
const { v4 : uuidv4 } = require('uuid');
const { generateJWt, hashPass, checkPass } = require('../utils/authEncoding');
const isProd = process.env.NODE_ENV === 'production';
async function signUpUser(req, res, next) {
	const { body: user } = req;

	const { email, password } = user;

	if (!email || !password) {
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
		console.log(result);

		req._auth = { role: 'user', userId: result[0].userId };
		const token = generateJWt(req._auth);

		setCookie(res, token);
		delete result[0].password;

		return res.status(200).send({
			result: true,
			data: result[0],
			code: 200,
			message: 'Successful'
		});
	} catch (error) {
		if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
			return res.status(409).send({
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

async function signInUser(req, res, next) {
	const { email, password } = req.body;

	if (!email || !password) {
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
			return res.status(400).send({
				result: false,
				data: null,
				code: 400,
				message: 'Wrong email'
			})
		}
		const isPasswordEqual = await checkPass(password, user.password);

		if (!isPasswordEqual) {
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

		return res.status(200).send({
			result: true,
			data: groupByPrefix('mama', user),
			code: 200,
			message: 'Successful'
		});
	} catch (error) {
		console.log('Error [SIGN IN USER]: ', error)
	}
}

function logOutUser(req, res, next) {
	clearCookie(res);

	res.send({ result: true });
	next();
}

async function checkIsTokenExpired(req, res, next) {
	const { userId } = req._auth;

	if (!userId) {
		return res.status(401).send({ result: false, message: 'Access denied', data: null});
	}

	try {
		const user = await knex('users')
			.leftJoin('mama_about', 'users.userId', 'mama_about.userId')
			.select('users.*',
				'mama_about.mood as mama_mood',
				'mama_about.hasRituals as mama_hasRituals',
				'mama_about.isTimerUsed as mama_isTimerUsed',
				'mama_about.timer as mama_timer')
			.where('users.userId', userId )
			.first();

		delete user.password;
		return res.status(200).send({ result: true, message: 'User authorized', data: groupByPrefix('mama', user)});
	} catch(error) {
		console.log('Error [checkIsTokenExpired]:', error);
		clearCookie(res);
		return res.status(401).send({ result: false, message: 'Token expired', data: null});
	}
}

function setCookie(res, token) {
	res.cookie('token', token, {
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? 'None' : 'Lax',
		path: '/user',
		expires: new Date(Date.now() + 86400000)
	});
}

function clearCookie(res) {
	res.clearCookie('token', {
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? 'None' : 'Lax',
		path: '/user',
	});
}

function groupByPrefix(prefix, obj) {
	const related = {};
	const general = {};
	for (const [key, value] of Object.entries(obj)) {
		if (key.startsWith(`${prefix}_`)) {
			const cleanKey = key.replace(`${prefix}_`, '');
			related[cleanKey] = value;
		} else {
			general[key] = value;
		}
	}
	general[prefix] = related;
	return general;
}

module.exports = {
	signInUser,
	signUpUser,
	logOutUser,
	checkIsTokenExpired
}
