let knexLib = require('knex');
const knexConfig = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);
const { v4 : uuidv4 } = require('uuid');

async function signInUser(req, res, next) {
	const { body: user } = req;

	user.userId = uuidv4();
	try {
		const result = await knex('users').insert(user).returning('*');
		console.log(result);
		res.send({ result: true, body: result})
	} catch (error) {
		console.log('Error log in user', error)
	}

}

module.exports = {
	signInUser
}
