const router = require('express').Router();

const { addRitual } = require('../services/dailyRitualsService');
const {parserJwt} = require("../middleware/authMiddleware");

router.post('/add/:section', parserJwt, addRitual );

module.exports = { router }
