const router = require('express').Router();
const { parserJwt } = require("../middleware/authMiddleware");
const {
	updateMamaMood,
	getMamaInfo,
	saveMoodDetails,
	getUsersMoodHistory,
} = require('../services/mamaDataService');

router.get('/info', parserJwt, getMamaInfo);
router.post('/mood', parserJwt, updateMamaMood);
router.post('/mood/add', parserJwt, saveMoodDetails);
router.get('/mood/get', parserJwt, getUsersMoodHistory);


module.exports = { router }
