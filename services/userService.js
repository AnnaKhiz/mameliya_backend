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
		const result = await knex('users').where({ userId }).update(userData);
		res.send({ result: true, code: 200, data: result, message: 'Updated successfully'});
	} catch (error) {
		console.log('Error [UPDATE USER] :', error);
		res.send({ result: false, code: 500, data: [], message: 'Updated successfully'});
	}
}

module.exports = {
	updateUserInfo
}
