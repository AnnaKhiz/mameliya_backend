const router = require('express').Router();

const { addRitual, getRitualsBySection, addToMyRituals, getFavoriteRituals } = require('../services/dailyRitualsService');
const {parserJwt} = require("../middleware/authMiddleware");

router.get('/:section', parserJwt, getRitualsBySection);
router.get('/favorites/get', parserJwt, getFavoriteRituals);
router.post('/add', parserJwt, addRitual );
router.post('/favorites/add', parserJwt, addToMyRituals);

module.exports = { router }
