const router = require('express').Router();
const {
	getGoogleCalendar,
	getGoogleCalendarEvents,
	addGoogleEvent,
	removeEventFromGoogleCalendar,
	updateGoogleEvent
} = require('../services/googleRoutesService')

const { parserJwt} = require("../middleware/authMiddleware");
const { googleCalendarAuthMiddleware } = require("../middleware/googleCalendarAuthMiddleware");
const { googleCalendarEventsMiddleware } = require("../middleware/googleCalendarEventsMiddleware");



// GOOGLE CALENDAR
router.get('/check', parserJwt, googleCalendarAuthMiddleware, getGoogleCalendar);
router.get('/events/:type', parserJwt, googleCalendarEventsMiddleware, getGoogleCalendarEvents);

router.post('/event/add/:type', parserJwt, googleCalendarEventsMiddleware, addGoogleEvent);

router.patch('/event/update/:type/:eventId', parserJwt, googleCalendarEventsMiddleware, updateGoogleEvent);

router.delete('/event/remove/:type/:eventId', parserJwt, googleCalendarEventsMiddleware, removeEventFromGoogleCalendar);

module.exports = { router }
