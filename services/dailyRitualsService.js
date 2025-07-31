let knexLib = require('knex');
const knexConfig = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);
const { v4 : uuidv4 } = require('uuid');
const deepl = require('deepl-node');
const { deepLAPIKey } = require('../config/default');

const translator = new deepl.Translator(deepLAPIKey);

async function addRitual(req, res, next) {
	const { userId } = req._auth;
	const { body: ritual } = req;

	const ritualId = uuidv4();


	const newRitual = {
		id: ritualId,
		title: ritual.title,
		description: ritual.description,
		created_at: Date.now(),
		cosmetic_name: JSON.stringify(ritual.cosmetic_name),
		creator: userId ? userId :'Admin',
	}

	const sectionInserts = ritual.section_key.map(section => ({
		ritual_id: ritualId,
		section_key: section
	}))

	try {
		const textLanguage = await translator.translateText(newRitual.title, null, 'en-US', { tagHandling: 'html' });

		const newRitualWithLanguage = {
			...newRitual,
			lang: textLanguage.detectedSourceLang
		}

		await knex('daily_rituals').insert(newRitualWithLanguage);
		await knex('ritual_sections').insert(sectionInserts);
		await knex('favorite_rituals').insert({ user_id: userId, ritual_id: ritualId })

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
				'r.lang',
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
				'r.lang',
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

		const existingFavorites = await knex('favorite_rituals')
			.where('user_id', userId)
			.select('ritual_id');

		const existingIds = new Set(existingFavorites.map(fav => fav.ritual_id));

		const newFavorites = rituals.filter(ritual => !existingIds.has(ritual.id));

		if (newFavorites.length === 0) {
			return res.status(200).send({
				result: false,
				code: 204,
				data: [],
				message: 'All selected rituals already exist in favorites',
			});
		}
		const insertData = newFavorites.map(ritual => ({
			user_id: userId,
			ritual_id: ritual.id,
		}));

		await knex('favorite_rituals').insert(insertData);

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
					'r.lang',
					'fav.user_id'
				);

		const result = await Promise.all(favorites);

		res.send({ result: true, code: 200, data: result, message: 'Add to fav successfully'});
	} catch (error) {
		console.log('Error [ADD FAVORITE]', error);
		if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
			return res.send({ result: false, code: 409, data: [], message: 'Conflict, data already exist'});
		} else {
			res.send({ result: false, code: 500, data: [], message: 'Did not add'});
		}
	}
}

async function getFavoriteRituals(req, res, next) {
	const { userId } = req._auth;

	try {
		const result = await knex('daily_rituals as r')
			.leftJoin('favorite_rituals as fav', 'r.id', 'fav.ritual_id')
			.where('fav.user_id', userId)
			.select(
				'r.id',
				'r.title',
				'r.description',
				'r.creator',
				'r.created_at',
				'r.lang',
				'r.cosmetic_name',
			);


		res.send({ result: true, code: 200, data: result, message: 'Get from fav successfully'});
	} catch (error) {
		console.log('Error [GET FAVORITE LIST]', error);
		res.send({ result: false, code: 500, data: [], message: 'Did not find'});
	}
}

async function removeRituals(req, res, next) {
	const { userId } = req._auth;
	const { body: rituals } = req;

	try {
		const deletePromises = rituals.map(async (ritual) => {
			const ritualId = ritual.id;

			const [ritualFromDB] = await knex('daily_rituals')
				.where('id', ritualId)
				.select('creator');

			if (!ritualFromDB) return;

			if (ritualFromDB.creator === userId) {
				await knex('ritual_sections').where('ritual_id', ritualId).del();
				await knex('daily_rituals').where('id', ritualId).del();
				await knex('favorite_rituals').where('ritual_id', ritualId).del();
			} else {
				await knex('favorite_rituals')
					.where({ user_id: userId, ritual_id: ritualId })
					.del();
			}
		})

		await Promise.all(deletePromises);

		const result = await knex('daily_rituals as r')
			.leftJoin('favorite_rituals as fav', 'r.id', 'fav.ritual_id')
			.where('fav.user_id', userId)
			.select(
				'r.id',
				'r.title',
				'r.description',
				'r.creator',
				'r.created_at',
				'r.lang',
				'r.cosmetic_name',
			);


		res.send({ result: true, code: 200, data: result, message: 'Get from fav successfully'});

	} catch (error) {
		console.log('Error [REMOVE FAVORITE]', error);
		res.send({ result: false, code: 500, data: [], message: 'Did not remove'});
	}
}

module.exports = {
	addRitual,
	getRitualsBySection,
	addToMyRituals,
	getFavoriteRituals,
	removeRituals
}
