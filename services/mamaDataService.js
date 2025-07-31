let knexLib = require('knex');
const knexConfig = require('../knexfile.js');

const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);
const { getTokens } = require('../services/googleauthService');
const isProd = process.env.NODE_ENV === 'production';
const { groupByPrefixes } = require('../utils/groupByPrefixes');
const { v4 : uuidv4 } = require('uuid');

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

async function getUsersMoodHistory(req, res, next) {
	const { userId } = req._auth;

	try {
		const result = await knex('mood_history').where( { userId });

		res.send({
			result: true,
			data: result,
			code: 200,
			message: 'Mood history list'
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

async function addDiaryPost(req, res, next) {
	const { userId } = req._auth;
	const { body: diaryPost } = req;

	const newDiaryPost = {
		...diaryPost,
		id: uuidv4(),
		creator: userId,
		created_at: Date.now()
	}

	try {
		await knex('mama_diary').insert(newDiaryPost);

		const diaryNotes = await knex('mama_diary').where({ id: newDiaryPost.id });

		return res.status(200).send({ result: true, message: 'Post added', data: diaryNotes});
	} catch (error) {
		console.error('Error [add new diary post]: ', error);
		return res.status(500).send({ result: false, message: 'Post did not added', data: null});
	}
}

async function getDiaryPostsList(req, res, next) {
	const { userId } = req._auth;

	try {
		const posts = await knex('mama_diary').where( { creator : userId });

		if (!posts) {
			return res.status(403).send({ result: true, message: 'No posts found', data: []});
		}
		return res.status(200).send({ result: true, message: 'Got successfully', data: posts});

	} catch (error) {
		console.error('Error [get diary posts]: ', error);
		return res.status(500).send({ result: false, message: 'Post did not get posts', data: null});
	}
}

async function removeDiaryPostById(req, res, next) {
	const { userId } = req._auth;
	const { id: postId } = req.params;

	try {
		await knex('mama_diary').where( { id : postId }).del();

		const posts = await knex('mama_diary').where( { creator : userId });

		if (!posts) {
			return res.status(403).send({ result: true, message: 'No posts found', data: []});
		}
		return res.status(200).send({ result: true, message: 'Removed successfully', data: posts});

	} catch (error) {
		console.error('Error [remove diary post]: ', error);
		return res.status(500).send({ result: false, message: 'Post did not delete', data: null});
	}
}

async function updateDiaryPost(req, res, next) {
	const { userId } = req._auth;
	const { id: postId } = req.params;
	const { body: post } = req;

	const updatedPost = {
		...post,
		created_at: Date.now(),
	}

	try {
		await knex('mama_diary').where({ id: postId }).update(updatedPost);

		const posts = await knex('mama_diary').where( { creator : userId });

		if (!posts) {
			return res.status(403).send({ result: true, message: 'No posts found', data: []});
		}
		return res.status(200).send({ result: true, message: 'Removed successfully', data: posts});

	} catch (error) {
		console.error('Error [update diary post]: ', error);
		return res.status(500).send({ result: false, message: 'Post did not updated', data: null});
	}

}


module.exports = {
	updateMamaMood,
	getMamaInfo,
	saveMoodDetails,
	getUsersMoodHistory,
	addDiaryPost,
	getDiaryPostsList,
	removeDiaryPostById,
	updateDiaryPost
}
