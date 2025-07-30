const router = require('express').Router();
const { parserJwt } = require("../middleware/authMiddleware");
const {
	updateMamaMood,
	getMamaInfo,
	saveMoodDetails,
	getUsersMoodHistory,
	addDiaryPost,
	getDiaryPostsList
} = require('../services/mamaDataService');

router.get('/info', parserJwt, getMamaInfo);
router.get('/mood/get', parserJwt, getUsersMoodHistory);
router.post('/mood', parserJwt, updateMamaMood);
router.post('/mood/add', parserJwt, saveMoodDetails);
router.get('/diary', parserJwt, getDiaryPostsList);
router.post('/diary/add', parserJwt, addDiaryPost);



module.exports = { router }
