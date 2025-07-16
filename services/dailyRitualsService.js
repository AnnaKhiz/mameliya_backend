let knexLib = require('knex');
const knexConfig = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);
const { v4 : uuidv4 } = require('uuid');

async function addRitual(req, res, next) {
	const { userId } = req._auth;
	const { body: ritual } = req;
	const { section } = req.params;

	console.log('userId', userId)
	console.log('ritual', ritual)
	console.log('section', section)

	try {
		res.send({ result: true, code: 200, data: [], message: 'Added successfully'})
	} catch (error) {
		console.log('Error [ADD RITUAL]', error);
		res.send({ result: false, code: 500, data: [], message: 'Ritual did not added'})
	}

}

module.exports = {
	addRitual
}
