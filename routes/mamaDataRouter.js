const router = require('express').Router();
const { parserJwt } = require("../middleware/authMiddleware");
const {
	updateMamaMood,
	getMamaInfo,
	saveMoodDetails,
	getUsersMoodHistory,
	addDiaryPost,
	getDiaryPostsList,
	removeDiaryPostById
} = require('../services/mamaDataService');

router.get('/info', parserJwt, getMamaInfo);
router.get('/mood/get', parserJwt, getUsersMoodHistory);
router.post('/mood', parserJwt, updateMamaMood);
router.post('/mood/add', parserJwt, saveMoodDetails);
router.get('/diary', parserJwt, getDiaryPostsList);
router.post('/diary/add', parserJwt, addDiaryPost);
router.delete('/diary/remove/:id', parserJwt, removeDiaryPostById);



module.exports = { router }
