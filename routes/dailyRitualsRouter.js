const router = require('express').Router();

const { addRitual, getRitualsBySection } = require('../services/dailyRitualsService');
const {parserJwt} = require("../middleware/authMiddleware");

router.get('/:section', getRitualsBySection);
router.post('/add', parserJwt, addRitual );

module.exports = { router }
