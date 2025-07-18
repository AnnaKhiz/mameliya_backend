const router = require('express').Router();

const { addRitual, getRitualsBySection, addToMyRituals } = require('../services/dailyRitualsService');
const {parserJwt} = require("../middleware/authMiddleware");

router.get('/:section', parserJwt, getRitualsBySection);
router.post('/add', parserJwt, addRitual );
router.post('/favorites', parserJwt, addToMyRituals)

module.exports = { router }
