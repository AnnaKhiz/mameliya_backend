let knexLib = require('knex');
const knexConfig = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);

async function updateMamaMood (req, res, next) {
	const { mood } = req.body;
	const { userId } = req._auth;

	try {
		await knex('mama_about').insert({ mood, userId }).onConflict('userId').merge();

		const updatedRecordsObject = await knex('mama_about').where({ userId }).first();
		res.send({ result: true, data: updatedRecordsObject })
	} catch (error) {
		console.log('Error [insert/update mood]:', error)
		res.send({ result: false, data: [] })
	}
}

module.exports = {
	updateMamaMood
}
