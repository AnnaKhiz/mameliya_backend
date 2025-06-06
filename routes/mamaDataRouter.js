const router = require('express').Router();
const { parserJwt } = require("../middleware/authMiddleware");
const { updateMamaMood } = require('../services/mamaDataService');

router.post('/mood', parserJwt, updateMamaMood);

module.exports = { router }
