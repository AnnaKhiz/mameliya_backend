let knexLib = require('knex');
const knexConfig = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);
const { v4 : uuidv4 } = require('uuid');

async function addRitual(req, res, next) {
	// const { userId } = req._auth;
	const { body: ritual } = req;

	const ritualId = uuidv4();

	const newRitual = {
		id: ritualId,
		title: ritual.title,
		description: ritual.description,
		created_at: Date.now(),
		cosmetic_name: JSON.stringify(ritual.cosmetic_name),
		creator: 'Admin'
	}

	const sectionInserts = ritual.section_key.map(section => ({
		ritual_id: ritualId,
		section_key: section
	}))

	try {
		await knex('daily_rituals').insert(newRitual);
		await knex('ritual_sections').insert(sectionInserts);

		const result = await knex('daily_rituals as r')
			.leftJoin('ritual_sections as rs', 'r.id', 'rs.ritual_id')
			.where('r.id', newRitual.id)
			.select(
				'r.id',
				'r.title',
				'r.description',
				'r.creator',
				'r.created_at',
				'r.cosmetic_name',
				'rs.section_key'
			);

		res.send({ result: true, code: 200, data: result, message: 'Added successfully'});
	} catch (error) {
		console.log('Error [ADD RITUAL]', error);
		res.send({ result: false, code: 500, data: [], message: 'Ritual did not added'});
	}

}

module.exports = {
	addRitual
}
