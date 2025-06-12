const router = require('express').Router();
const { parserJwt } = require("../middleware/authMiddleware");
const {
	updateMamaMood,
	getMamaInfo,
	saveMoodDetails
} = require('../services/mamaDataService');

router.get('/info', parserJwt, getMamaInfo);
router.post('/mood', parserJwt, updateMamaMood);
router.post('/mood/add', parserJwt, saveMoodDetails)

module.exports = { router }
