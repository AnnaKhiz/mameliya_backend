const router = require('express').Router();
const { parserJwt } = require("../middleware/authMiddleware");
const { updateMamaMood, getMamaInfo } = require('../services/mamaDataService');

router.get('/info', parserJwt, getMamaInfo);
router.post('/mood', parserJwt, updateMamaMood);

module.exports = { router }
