const router = require('express').Router();

const {
	addRitual,
	getRitualsBySection,
	addToMyRituals,
	getFavoriteRituals,
	removeRituals
} = require('../services/dailyRitualsService');
const { parserJwt} = require("../middleware/authMiddleware");

router.get('/:section', parserJwt, getRitualsBySection);
router.get('/favorites/get', parserJwt, getFavoriteRituals);
router.post('/add', parserJwt, addRitual );
router.post('/favorites/add', parserJwt, addToMyRituals);
router.delete('/favorites/remove', parserJwt, removeRituals )

module.exports = { router }
