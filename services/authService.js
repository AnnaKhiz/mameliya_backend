let knexLib = require('knex');
const knexConfig = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);
const { v4 : uuidv4 } = require('uuid');
const { generateJWt, hashPass, checkPass } = require('../utils/authEncoding');
const isProd = process.env.NODE_ENV === 'production';
const { google} = require("googleapis");
const { getAuthUrl, oauth2Client } = require('../services/googleauthService')
async function signUpUser(req, res, next) {
	const { body: user } = req;

	const { email, password } = user;

	if (!email || !password) {
		return res.status(400).send({
			result: false,
			data: null,
			code: 400,
			message: 'Empty fields'
		})
	}
	user.userId = uuidv4();
	user.password = await hashPass(user.password);

	try {
		const result = await knex('users').insert(user).returning('*');
		const mamaInfo = {
			mood: 'good',
			hasRituals: false,
			isTimerUsed: false,
			timer: 5,
			userId: result[0].userId
		}
		await knex('mama_about').insert(mamaInfo).returning('*');

		req._auth = { role: 'user', userId: result[0].userId };
		const token = generateJWt(req._auth);

		setCookie(res, token);
		delete result[0].password;

		return res.status(200).send({
			result: true,
			data: result[0],
			code: 200,
			message: 'Successful'
		});
	} catch (error) {
		if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
			return res.status(409).send({
				result: false,
				data: null,
				code: 409,
				message: 'Email conflict'
			})
		} else {
			console.log('Error [SIGN UP USER]: ', error)
		}
	}
}

async function signInUser(req, res, next) {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).send({
			result: false,
			data: null,
			code: 400,
			message: 'Empty fields'
		})
	}

	try {
		const user = await knex('users')
			.leftJoin('mama_about', 'users.userId', 'mama_about.userId')
			.select('users.*',
				'mama_about.mood as mama_mood',
				'mama_about.hasRituals as mama_hasRituals',
				'mama_about.isTimerUsed as mama_isTimerUsed',
				'mama_about.timer as mama_timer')
			.where({ email } )
			.first();

		if (!user) {
			return res.status(400).send({
				result: false,
				data: null,
				code: 400,
				message: 'Wrong email'
			})
		}
		const isPasswordEqual = await checkPass(password, user.password);

		if (!isPasswordEqual) {
			return res.status(400).send({
				result: false,
				data: null,
				code: 400,
				message: 'Wrong password'
			})
		}

		req._auth = { role: 'user', userId: user.userId };
		const token = generateJWt(req._auth);

		setCookie(res, token);

		delete user.password;

		return res.status(200).send({
			result: true,
			data: groupByPrefix('mama', user),
			code: 200,
			message: 'Successful'
		});
	} catch (error) {
		console.log('Error [SIGN IN USER]: ', error)
	}
}

function logOutUser(req, res, next) {
	clearCookie(res);

	res.send({ result: true });
	next();
}

async function checkIsTokenExpired(req, res, next) {
	const { userId } = req._auth;

	if (!userId) {
		return res.status(401).send({ result: false, message: 'Access denied', data: null});
	}

	try {
		const user = await knex('users')
			.leftJoin('mama_about', 'users.userId', 'mama_about.userId')
			.select('users.*',
				'mama_about.mood as mama_mood',
				'mama_about.hasRituals as mama_hasRituals',
				'mama_about.isTimerUsed as mama_isTimerUsed',
				'mama_about.timer as mama_timer')
			.where('users.userId', userId )
			.first();

		delete user.password;
		return res.status(200).send({ result: true, message: 'User authorized', data: groupByPrefix('mama', user)});
	} catch(error) {
		console.log('Error [checkIsTokenExpired]:', error);
		clearCookie(res);
		return res.status(401).send({ result: false, message: 'Token expired', data: null});
	}
}

function setCookie(res, token) {
	res.cookie('token', token, {
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? 'None' : 'Lax',
		path: '/user',
		expires: new Date(Date.now() + 86400000)
	});
}

function clearCookie(res) {
	res.clearCookie('token', {
		httpOnly: true,
		secure: isProd,
		sameSite: isProd ? 'None' : 'Lax',
		path: '/user',
	});
}

function groupByPrefix(prefix, obj) {
	const related = {};
	const general = {};
	for (const [key, value] of Object.entries(obj)) {
		if (key.startsWith(`${prefix}_`)) {
			const cleanKey = key.replace(`${prefix}_`, '');
			related[cleanKey] = value;
		} else {
			general[key] = value;
		}
	}
	general[prefix] = related;
	return general;
}

async function getGoogleCalendar(req, res, next) {
	const { googleToken } = req._googleToken;
	const { userId } = req._auth;

	if (googleToken ) {
		await knex('users').where({ userId } ).update({ google_refresh : googleToken.refresh_token});
		return res.redirect(`http://localhost:5173/user/${userId}/mama/beauty_calendar?status=success`);
	}
	await knex('users').where({ userId } ).update({ google_refresh : ''});
	return res.redirect(`http://localhost:5173/user/${userId}/mama/beauty_calendar?status=bad_request`);
}

async function getGoogleCalendarEvents(req, res, next) {
	const { userId } = req._auth;
	const { type: calendarName } = req.params;

	try {
		const { googleToken } = req._googleToken;

		await checkGoogleToken(req, res, next, googleToken, userId);

		if (googleToken ) {
			const calendar = await getGoogleCalendarObject(googleToken);
			const existingCalendar = await checkExistingCalendar(calendar, calendarName);

			if (!existingCalendar) {
				return res.send({
					result: true,
					code: 200,
					data: { events: [] },
					message: `Google calendar [${calendarName}] is empty`}
				)}

			const eventsResponse = await calendar.events.list({
				calendarId: existingCalendar.id,
				singleEvents: true,
				orderBy: 'startTime',
			});

			return res.send({
				result: true,
				code: 200,
				data: { events: eventsResponse.data.items },
				message: 'Google calendar is available'})
		}

	} catch (error) {
		console.error('Google calendar [GET GOOGLE EVENTS] ', error);
		if (error.code === 401 || error.response?.status === 401) {
			return res.status(401).send({
				result: false,
				code: 401,
				data: null,
				message: 'Unauthorized or token expired'
			});
		}
		return res.status(500).send({
			result: false,
			code: 500,
			data: null,
			message: 'Server error'
		})
	}
}
async function addGoogleEvent(req, res, next) {
	const { userId } = req._auth;
	const { body: event } = req;
	const { type: calendarName } = req.params;

	if (!event.start || !event.end) {
		return res.status(406).send({
			result: false,
			code: 406,
			data: null,
			message: 'No event data!'
		});
	}

	try {
		const { googleToken } = req._googleToken;

		await checkGoogleToken(req, res, next, googleToken, userId);

		const calendar = await getGoogleCalendarObject(googleToken);
		const existingCalendar = await checkExistingCalendar(calendar, calendarName);

		const newEvent = adaptEventTypeForGoogleAPI(event);

		if (!existingCalendar) {
			const newCalendar = await calendar.calendars.insert({
				requestBody: {
					summary: calendarName,
					timeZone: 'UTC',
				},
			});

			const resultNew = await createNewEventObject(calendar, newCalendar, newEvent);

			return res.send({
				result: true,
				code: 200,
				data: resultNew.data,
				message: 'Created successfully'
			})
		}

		const result = await createNewEventObject(calendar, existingCalendar, newEvent);

		return res.status(200).send({
			result: true,
			code: 200,
			data: result.data,
			message: 'Created successfully'
		});

	} catch (error) {
		console.error('Google calendar [ADD GOOGLE EVENT] ', error);
		if (error.code === 401 || error.response?.status === 401) {
			return res.status(401).send({
				result: false,
				code: 401,
				data: null,
				message: 'Unauthorized or token expired'
			});
		}
		return res.status(500).send({
			result: false,
			code: 500,
			data: null,
			message: 'Server error'
		})
	}
}

async function updateGoogleEvent(req, res, next) {
	const { userId } = req._auth;
	const { type: calendarName, eventId } = req.params;
	const { body: updatedEvent } = req;

	try {
		if (!eventId || !calendarName) {
			return res.status(406).send({
				result: false,
				code: 406,
				data: null,
				message: 'No calendar data!'
			});
		}

		const { googleToken } = req._googleToken;
		await checkGoogleToken(req, res, next, googleToken, userId);

		const calendar = await getGoogleCalendarObject(googleToken);
		const existingCalendar = await checkExistingCalendar(calendar, calendarName);

		if (!existingCalendar) {
			return res.status(404).send({
				result: false,
				code: 404,
				data: null,
				message: `Calendar [${calendarName}] does not exist`
			});
		}

		const newUpdatedEvent = adaptEventTypeForGoogleAPI(updatedEvent);

		const response = await calendar.events.patch({
			calendarId: existingCalendar.id,
			eventId,
			requestBody: newUpdatedEvent
		});

		return res.status(200).send({
			result: true,
			code: 200,
			data: response.data,
			message: 'Updated successfully'
		});

	} catch (error) {
		console.error('Google calendar [UPDATE GOOGLE EVENT] ', error);
		if (error.code === 401 || error.response?.status === 401) {
			return res.status(401).send({
				result: false,
				code: 401,
				data: null,
				message: 'Unauthorized or token expired'
			});
		}
		return res.status(500).send({
			result: false,
			code: 500,
			data: null,
			message: 'Server error'
		})
	}
}

async function removeEventFromGoogleCalendar(req, res, next) {
	const { userId } = req._auth;
	const { type: calendarName, eventId } = req.params;

	try {
		if (!eventId || !calendarName) {
			return res.status(406).send({
				result: false,
				code: 406,
				data: null,
				message: 'No calendar data!'
			});
		}
		const { googleToken } = req._googleToken;
		await checkGoogleToken(req, res, next, googleToken, userId);

		const calendar = await getGoogleCalendarObject(googleToken);
		const existingCalendar = await checkExistingCalendar(calendar, calendarName);

		if (!existingCalendar) {
			return res.status(404).send({
				result: false,
				code: 404,
				data: null,
				message: `Calendar [${calendarName}] does not exist`
			});
		}

		await calendar.events.delete({
			calendarId: existingCalendar.id,
			eventId: eventId
		})

		return res.status(200).send({
			result: true,
			code: 200,
			data: { id: eventId },
			message: `Deleted successfully`
		});

	} catch (error) {
		console.error('Google calendar [REMOVE GOOGLE EVENT] ', error);
	}
}

async function checkGoogleToken(req, res, next, token, userId) {
	if (!token.access_token) {
		await knex('users').where({ userId } ).update({ google_refresh : ''});
		return res.status(401).send({
			result: false,
			code: 401,
			data: null,
			message: 'No token'
		});
	}
	return true;
}

// helpers
async function getGoogleCalendarObject(token) {
	await oauth2Client.setCredentials(token);
	return google.calendar({ version: 'v3', auth: oauth2Client});
}

async function checkExistingCalendar(calendar, calendarName) {
	const calendarList = await calendar.calendarList.list();
	return calendarList.data.items.find(el => el.summary === calendarName);
}

async function createNewEventObject(calendar, existingCalendar, event) {
	const calendarId = existingCalendar?.id || existingCalendar?.data?.id;

	if (!calendarId) return;

	return await calendar.events.insert({
		calendarId,
		resource: event
	});
}

function adaptEventTypeForGoogleAPI(event) {
	return {
		summary: event.title,
		description: event.description,
		start: {
		dateTime: new Date(event.start).toISOString(),
			timeZone: 'UTC',
	},
		end: {
			dateTime: new Date(event.end).toISOString(),
				timeZone: 'UTC',
		}
	}
}


module.exports = {
	signInUser,
	signUpUser,
	logOutUser,
	checkIsTokenExpired,
	getGoogleCalendar,
	getGoogleCalendarEvents,
	addGoogleEvent,
	removeEventFromGoogleCalendar,
	updateGoogleEvent
}
