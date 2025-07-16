const { oauth2Client } = require("./googleauthService");
const { google } = require("googleapis");
let knexLib = require('knex');
const knexConfig = require('../knexfile.js');
const environment = process.env.NODE_ENV || 'development';
const knex = knexLib(knexConfig[environment]);

async function getGoogleCalendar(req, res, next) {
	const { userId } = req._auth;
	let redirectUrl = '';
	const { calendarName, redirect } = req._queryData;
	try {

		const { googleToken } = req._googleToken;
		if (googleToken ) {
			await knex('users').where({ userId } ).update({ google_refresh : googleToken.refresh_token});

			redirectUrl = calendarName === 'all'
				? `${redirect}?status=success&modal=success`
				: `http://localhost:5173/user/${userId}/${calendarName}/${calendarName}_calendar?status=success`;

			return res.redirect(redirectUrl);
		}
		await knex('users').where({ userId } ).update({ google_refresh : ''});

		redirectUrl = calendarName === 'all'
			? `${redirect}?status=success`
			: `http://localhost:5173/user/${userId}/${calendarName}/${calendarName}_calendar?status=bad_request`;

		return res.redirect(redirectUrl);
	} catch (error) {
		console.log('Error [connecting google calendar]: ', error);
		return res.redirect(`http://localhost:5173/user/${userId}/${calendarName}`);
	}

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

			let eventsResponse;

			if (calendarName === 'all') {
				const promises = existingCalendar.filter(cal => cal.accessRole === 'owner').map(e =>
					calendar.events.list({
						calendarId: e.id,
						timeMin: new Date('2000-01-01').toISOString(),
						singleEvents: true,
						orderBy: 'startTime',
					}).then(result => ({ calendar: e.summary, events: result.data.items || [] }))
				)

				const allEvents = await Promise.all(promises);
				eventsResponse = allEvents.flatMap(item => item.events.map(event => ({
					...event,
					calendarName: item.calendar
				}))
			)

				return res.send({
					result: true,
					code: 200,
					data: { events: eventsResponse },
					message: 'Google calendar is available'
				})
			}

			eventsResponse = await calendar.events.list({
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
		requestErrorHandling(error, res);
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
			message: 'No calendar data!'
		});
	}

	try {

		const { calendar, existingCalendar, newEvent } = await checksAndGetCalendars(req, res, next, calendarName, userId, null, event, true);

		const result = await createNewEventObject(calendar, existingCalendar, newEvent);

		result.data.calendarName = calendarName;

		return res.status(200).send({
			result: true,
			code: 200,
			data: result.data,
			message: 'Created successfully'
		});

	} catch (error) {
		console.error('Google calendar [ADD GOOGLE EVENT] ', error);
		requestErrorHandling(error, res);
	}
}
async function updateGoogleEvent(req, res, next) {
	const { userId } = req._auth;
	const { type: calendarName, eventId } = req.params;
	const { body: event } = req;

	try {
		const { calendar, existingCalendar, newEvent } = await checksAndGetCalendars(req, res, next, calendarName, userId, eventId, event);

		const response = await calendar.events.patch({
			calendarId: existingCalendar.id,
			eventId,
			requestBody: newEvent
		});

		response.data.calendarName = calendarName;

		return res.status(200).send({
			result: true,
			code: 200,
			data: response.data,
			message: 'Updated successfully'
		});

	} catch (error) {
		console.error('Google calendar [UPDATE GOOGLE EVENT] ', error);
		requestErrorHandling(error, res);
	}
}

async function removeEventFromGoogleCalendar(req, res, next) {
	const { userId } = req._auth;
	const { type: calendarName, eventId } = req.params;

	try {
		const { calendar, existingCalendar } = await checksAndGetCalendars(req, res, next, calendarName, userId, eventId);

		await calendar.events.delete({
			calendarId: existingCalendar.id,
			eventId
		})

		return res.status(200).send({
			result: true,
			code: 200,
			data: { id: eventId },
			message: `Deleted successfully`
		});

	} catch (error) {
		console.error('Google calendar [REMOVE GOOGLE EVENT] ', error);
		requestErrorHandling(error, res)
	}
}

// HELPERS
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
async function getGoogleCalendarObject(token) {
	await oauth2Client.setCredentials(token);
	return google.calendar({ version: 'v3', auth: oauth2Client});
}
async function checkExistingCalendar(calendar, calendarName) {
	const calendarList = await calendar.calendarList.list();

	if (calendarName === 'all') {
		return calendarList.data.items;
	}

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
function requestErrorHandling(error, res) {
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
function checkEventCalendarDataExist(eventId, calendarName, res) {
	if (!eventId || !calendarName) {
		return res.status(406).send({
			result: false,
			code: 406,
			data: null,
			message: 'No calendar data!'
		});
	}
	return true;
}
async function checksAndGetCalendars(
	req,
	res,
	next,
	calendarName,
	userId,
	eventId = null,
	event = null,
	create = false
) {
	if (eventId && !checkEventCalendarDataExist(eventId, calendarName, res)) return;
	let newEvent = null;

	if (event) {
		newEvent = adaptEventTypeForGoogleAPI(event);
	}

	const { googleToken } = req._googleToken;
	await checkGoogleToken(req, res, next, googleToken, userId);

	const calendar = await getGoogleCalendarObject(googleToken);
	const existingCalendar = await checkExistingCalendar(calendar, calendarName);

	if (!existingCalendar) {
		if (create) {
			await createNewCalendar(calendar, calendarName, newEvent, res);
		} else {
			return res.status(404).send({
				result: false,
				code: 404,
				data: null,
				message: `Calendar [${calendarName}] does not exist`
			});
		}
	}

	return {
		calendar,
		existingCalendar,
		newEvent
	}
}

async function createNewCalendar(calendar, calendarName, newEvent, res) {
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

module.exports = {
	getGoogleCalendar,
	getGoogleCalendarEvents,
	addGoogleEvent,
	removeEventFromGoogleCalendar,
	updateGoogleEvent
}
