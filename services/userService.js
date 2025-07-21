let knexLib = require('knex');
const knexConfig = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);
const { v4 : uuidv4 } = require('uuid');
const {  hashPass, checkPass } = require('../utils/authEncoding');


async function updateUserInfo(req, res, next) {
	const { userId } = req._auth;
	const { body: userData } = req;

	const { password } = userData;

	if (password) {
		userData.password = await hashPass(password);
	}

	try {
		await knex('users').where({ userId }).update(userData);
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
		res.send({ result: true, code: 200, data: user, message: 'Updated successfully'});
	} catch (error) {
		console.log('Error [UPDATE USER] :', error);
		res.send({ result: false, code: 500, data: [], message: 'Updated successfully'});
	}
}

module.exports = {
	updateUserInfo
}
