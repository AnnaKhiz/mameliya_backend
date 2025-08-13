let knexLib = require('knex');
const knexConfig = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);
const logger = require('../utils/logger')('notifications');
async function getNotificationList(req, res, next) {
	const { userId } = req._auth;

	try {
		const response = await knex('notifications').where({ userId });

		if (!response) {
			logger.info(`${req.method} ${req.url} 404 No notifications found`);
			return res.send({ result: true, code: 404, data: [], message: 'No notifications found'});
		}

		logger.info(`${req.method} ${req.url} 200 Notifications uploaded successfully`);
		return res.send({ result: true, code: 200, data: response, message: 'Notifications uploaded successfully'});

	} catch (error) {
		console.log('Error [GET NOTIFICATIONS] :', error);
		logger.info(`[${req.method}] ${req.url} 500 Error message: ${error}`);
		res.send({ result: false, code: 500, data: [], message: 'Notifications did not get'});
	}
}

async function updateNotificationState(req, res, next) {
	const { userId } = req._auth;
	const { id: notifyId } = req.params;

	try {
		const response = await knex('notifications').where({ id: notifyId }).update({ is_read: true });

		if (!response) {
			logger.info(`${req.method} ${req.url} 403 Notification did not update`);
			return res.send({ result: true, code: 403, data: [], message: 'Notification did not update'});
		}

		const result = await knex('notifications').where({ userId });

		logger.info(`${req.method} ${req.url} 200 Notifications updated successfully`);
		return res.send({ result: true, code: 200, data: result, message: 'Notifications updated successfully'});

	} catch (error) {
		console.log('Error [GET NOTIFICATIONS] :', error);
		logger.info(`[${req.method}] ${req.url} 500 Error message: ${error}`);
		res.send({ result: false, code: 500, data: [], message: 'Notifications did not get'});
	}
}

module.exports = {
	getNotificationList,
	updateNotificationState
}
