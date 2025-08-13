let knexLib = require('knex');
const knexConfig = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);
const { v4 : uuidv4 } = require('uuid');
const {groupByPrefixes} = require("../utils/groupByPrefixes");
const logger = require('../utils/logger')('mama-mood-diary');

async function updateMamaMood(req, res, next) {
	const { mood } = req.body;
	const { userId } = req._auth;

	try {
		await knex('mama_about').insert({ mood, userId }).onConflict('userId').merge();

		const updatedRecordsObject = await knex('mama_about').where({ userId }).first();

		logger.info(`${req.method} ${req.url} 200 Mood state updated successfully`);
		res.send({
			result: true,
			data: updatedRecordsObject,
			code: 200,
			message: 'Mood updated'
		})
	} catch (error) {
		console.log('Error [insert/update mood]:', error);
		logger.info(`${req.method} ${req.url} 500 Message error: ${error}`);
		res.status(500).send({
			result: false,
			data: [],
			code: 500,
			message: 'Mood not updated'
		})
	}
}

async function getMamaInfo(req, res, next) {
	const { userId } = req._auth;

	try {
		const result = await knex('mama_about')
			.leftJoin('timer_details', 'mama_about.userId', 'timer_details.userId')
			.select('mama_about.*',
				'timer_details.id as timer_id',
				'timer_details.total_time as timer_total_time',
				'timer_details.paused_time as timer_paused_time',
				'timer_details.is_paused as timer_is_paused',
				'timer_details.started_at as timer_started_at' ,
				'timer_details.paused_at as timer_paused_at',
				'timer_details.is_used_today as timer_is_used_today')
			.where('mama_about.userId', userId)
			.first();

		logger.info(`${req.method} ${req.url} 200 Mama info got successfully`);
		res.send({
			result: true,
			data: groupByPrefixes(['timer'], result),
			code: 200,
			message: 'Successful'
		})
	} catch (error) {
		console.log('Error [get mama info]:', error);
		logger.info(`${req.method} ${req.url} 500 Message error: ${error}`);
		res.status(500).send({
			result: false,
			data: [],
			code: 500,
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

		logger.info(`${req.method} ${req.url} 200 Mood history updated successfully`);
		res.send({
			result: true,
			data: result,
			code: 200,
			message: 'Mood history updated'
		})
	} catch (error) {
		console.log('Error [post mood details]:', error);
		logger.info(`${req.method} ${req.url} 500 Message error: ${error}`);
		res.status(500).send({
			result: false,
			data: [],
			code: 500,
			message: 'Not found'
		})
	}
}

async function getUsersMoodHistory(req, res, next) {
	const { userId } = req._auth;

	try {
		const result = await knex('mood_history').where( { userId });

		logger.info(`${req.method} ${req.url} 200 Mood history list got successfully`);
		res.send({
			result: true,
			data: result,
			code: 200,
			message: 'Mood history list'
		})
	} catch (error) {
		console.log('Error [post mood details]:', error);
		logger.info(`${req.method} ${req.url} 500 Message error: ${error}`);
		res.status(500).send({
			result: false,
			data: [],
			code: 500,
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

		logger.info(`${req.method} ${req.url} 200 New diary post added successfully`);
		return res.status(200).send({ result: true, message: 'Post added', data: diaryNotes});
	} catch (error) {
		console.error('Error [add new diary post]: ', error);
		logger.info(`${req.method} ${req.url} 500 Message error: ${error}`);
		return res.status(500).send({ result: false, message: 'Post did not added', data: null});
	}
}

async function getDiaryPostsList(req, res, next) {
	const { userId } = req._auth;

	try {
		const posts = await knex('mama_diary').where( { creator : userId });

		if (!posts) {
			logger.info(`${req.method} ${req.url} 403 Diary posts list did not found`);
			return res.status(403).send({ result: true, message: 'No posts found', data: []});
		}
		logger.info(`${req.method} ${req.url} 200 Diary posts list uploaded successfully`);
		return res.status(200).send({ result: true, message: 'Got successfully', data: posts});

	} catch (error) {
		console.error('Error [get diary posts]: ', error);
		logger.info(`${req.method} ${req.url} 500 Message error: ${error}`);
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
			logger.info(`${req.method} ${req.url} 403 Post removed. User does not have any more posts`);
			return res.status(403).send({ result: true, message: 'No posts found', data: []});
		}
		logger.info(`${req.method} ${req.url} 200 Post removed. Users post list uploaded successfully`);
		return res.status(200).send({ result: true, message: 'Removed successfully', data: posts});

	} catch (error) {
		console.error('Error [remove diary post]: ', error);
		logger.info(`${req.method} ${req.url} 500 Message error: ${error}`);
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
			logger.info(`${req.method} ${req.url} 403 Post updated. User does not have any more posts`);
			return res.status(403).send({ result: true, message: 'No posts found', data: []});
		}
		logger.info(`${req.method} ${req.url} 200 Post updated. Users post list uploaded successfully`);
		return res.status(200).send({ result: true, message: 'Removed successfully', data: posts});

	} catch (error) {
		console.error('Error [update diary post]: ', error);
		logger.info(`${req.method} ${req.url} 500 Message error: ${error}`);
		return res.status(500).send({ result: false, message: 'Post did not updated', data: null});
	}

}

async function updateTimerValue(req, res, next) {
	const { userId } = req._auth;
	const { body: timer } = req;

	const updatedTimer = {
		...timer,
		userId,
		paused_time: timer.paused_time || timer.total_time * 60,
		is_paused: timer.is_paused || false,
		started_at: Date.now(),
		paused_at: timer.is_paused ? Date.now() : null,
		is_used_today: timer.is_used_today || false
	}

	try {
		if (updatedTimer.total_time) {
			await knex('mama_about').where({ userId }).update({ timer: updatedTimer.total_time });
		}
		const existingTimer = await knex('timer_details').where({ userId }).first();
		let result;

		if (existingTimer) {
			result = await knex('timer_details').where({ userId }).update(updatedTimer);
		} else {
			result = await knex('timer_details').where({ userId }).insert(updatedTimer);
		}

		const response = await knex('timer_details')
			.where({ userId })
			.first();

		logger.info(`${req.method} ${req.url} 200 Timer value updated`);
		return res.status(200).send({ result: true, message: 'Timer value updated', data: response});
	} catch (error) {
		console.error('Error [update timer value]: ', error);
		logger.info(`${req.method} ${req.url} 500 Message error: ${error}`);
		return res.status(500).send({ result: false, message: 'Timer value did not updated', data: null});
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
	updateDiaryPost,
	updateTimerValue
}
