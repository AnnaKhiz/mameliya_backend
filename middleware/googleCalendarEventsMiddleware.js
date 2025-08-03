const { getAuthUrl, oauth2Client } = require( "../services/googleauthService");
const isProd = process.env.NODE_ENV === 'production';
let knexLib = require('knex');
const knexConfig = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);
const logger = require('../utils/logger')('google-calendar-events-middleware');

async function googleCalendarEventsMiddleware (req, res, next) {
	const { userId } = req._auth;

	try {
		const { type: calendarName, redirect } = req.query;

		const accessToken = req.cookies.googleToken;
		const refreshToken = await getRefreshTokenFromDB(userId);

		if (!accessToken) {
			logger.info(`${req.method} ${req.url} No access token. _googleToken = {}`);
			req._googleToken = { googleToken: {} };
			return next()
		} else {
			oauth2Client.setCredentials({
				access_token: accessToken,
				refresh_token: refreshToken
			});
			logger.info(`${req.method} ${req.url} Access token exist. added _queryData`);
			req._queryData = { calendarName, redirect };

			const tokens = await oauth2Client.refreshAccessToken();
			const credentials = tokens.credentials;

			if (tokens && credentials.access_token !== accessToken) {
				logger.info(`${req.method} ${req.url} SET COOKIES googleToken`);
				res.cookie('googleToken', credentials.access_token, {
					httpOnly: true,
					secure: isProd,
					sameSite: isProd ? 'None' : 'Lax',
					path: '/user',
					expires: new Date(Date.now() + 86400000)
				});
				oauth2Client.setCredentials(credentials);

				req._googleToken = { googleToken: oauth2Client.credentials };
				next();
			}
		}

	} catch (error) {
		console.log('Error middleware [google calendar events] ', error);
		logger.info(`[${req.method}] ${req.url} 500 Error message: ${error}`);
		return res.redirect(getAuthUrl())
	}
}

async function getRefreshTokenFromDB(userId) {
	let result = null;
	try {
		const response = await knex('users').where({ userId }).first();
		result = response.google_refresh
	} catch (error) {
		console.log('Error [getting refresh token from DB] ', error)
	}
	return result
}

module.exports = { googleCalendarEventsMiddleware }
