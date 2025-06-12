let knexLib = require('knex');
const knexConfig = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);

async function updateMamaMood(req, res, next) {
	const { mood } = req.body;
	const { userId } = req._auth;

	try {
		await knex('mama_about').insert({ mood, userId }).onConflict('userId').merge();

		const updatedRecordsObject = await knex('mama_about').where({ userId }).first();
		res.send({
			result: true,
			data: updatedRecordsObject,
			code: 200,
			message: 'Mood updated'
		})
	} catch (error) {
		console.log('Error [insert/update mood]:', error)
		res.status(400).send({
			result: false,
			data: [],
			code: 400,
			message: 'Mood not updated'
		})
	}
}

async function getMamaInfo(req, res, next) {
	const { userId } = req._auth;

	try {
		const result = await knex('mama_about').where({ userId }).first();
		res.send({
			result: true,
			data: result,
			code: 200,
			message: 'Successful'
		})
	} catch (error) {
		console.log('Error [get mama info]:', error);
		res.status(400).send({
			result: false,
			data: [],
			code: 400,
			message: 'Not found'
		})
	}
}

async function saveMoodDetails(req, res, next) {
	const { userId } = req._auth;
	const { body } = req;

	const moodHistory = {
		...body,
		userId,
		date: Date.now()
	}

	try {
		await knex('mood_history')
			.insert(moodHistory)

		const result = await knex('mood_history').where( { userId });

		res.send({
			result: true,
			data: result,
			code: 200,
			message: 'Mood history updated'
		})
	} catch (error) {
		console.log('Error [post mood details]:', error);
		res.status(400).send({
			result: false,
			data: [],
			code: 400,
			message: 'Not found'
		})
	}


}

module.exports = {
	updateMamaMood,
	getMamaInfo,
	saveMoodDetails
}
