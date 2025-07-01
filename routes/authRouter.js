const router = require('express').Router();
const { signUpUser,
	signInUser,
	logOutUser,
	checkIsTokenExpired,
	getGoogleCalendarEvents,
	getGoogleCalendar,
	addGoogleEvent,
	removeEventFromGoogleCalendar,
} = require('../services/authService');
const {parserJwt} = require("../middleware/authMiddleware");
const {googleCalendarAuthMiddleware} = require("../middleware/googleCalendarAuthMiddleware");
const { googleCalendarEventsMiddleware } = require("../middleware/googleCalendarEventsMiddleware");


// GET
router.post('/register', signUpUser);
router.post('/login', signInUser);
router.get('/logout', logOutUser);
router.get('/check-auth', parserJwt, checkIsTokenExpired);
router.get('/google/check', parserJwt, googleCalendarAuthMiddleware, getGoogleCalendar);
router.get('/google/events/:type', parserJwt, googleCalendarEventsMiddleware, getGoogleCalendarEvents);
router.post('/google/event/add/:type', parserJwt, googleCalendarEventsMiddleware, addGoogleEvent);
router.delete('/google/event/remove/:type', parserJwt, googleCalendarEventsMiddleware, removeEventFromGoogleCalendar);

module.exports = { router }
