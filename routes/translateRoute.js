const router = require('express').Router();
const { parserJwt } = require("../middleware/authMiddleware");
const { translateText } = require('../services/translateService');

router.post('/', translateText)

module.exports = { router }
