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

async function getRitualsBySection(req, res, next) {
	const { section } = req.params;

	try {
		const result = await knex('daily_rituals as r')
			.leftJoin('ritual_sections as rs', 'r.id', 'rs.ritual_id')
			.where('rs.section_key', section)
			.select(
				'r.id',
				'r.title',
				'r.description',
				'r.creator',
				'r.created_at',
				'r.cosmetic_name',
				'rs.section_key'
			);

		res.send({ result: true, code: 200, data: result, message: 'Done successfully'});
	} catch (error) {
		console.log('Error [GET RITUALS BY SECTION]', error);
		res.send({ result: false, code: 500, data: [], message: 'Rituals did not find'});
	}
}

async function addToMyRituals(req, res, next) {
	const { userId } = req._auth;
	const { body: rituals } = req;

	try {
		const promises = rituals.map( (ritual) => {
			const newRitual = {
				user_id: userId,
				ritual_id: ritual.id
			}
			return knex('favorite_rituals').insert(newRitual)
		})

		await Promise.all(promises);

		const favorites = await knex('daily_rituals as r')
				.leftJoin('favorite_rituals as fav', 'r.id', 'fav.ritual_id')
				.where('fav.user_id', userId)
				.select(
					'r.id',
					'r.title',
					'r.description',
					'r.creator',
					'r.created_at',
					'r.cosmetic_name',
					'fav.user_id'
				);

		const result = await Promise.all(favorites);

		res.send({ result: true, code: 200, data: result, message: 'Add to fav successfully'});
	} catch (error) {
		console.log('Error [ADD FAVORITE]', error);
		res.send({ result: false, code: 500, data: [], message: 'Did not add'});
	}
}

module.exports = {
	addRitual,
	getRitualsBySection,
	addToMyRituals
}
