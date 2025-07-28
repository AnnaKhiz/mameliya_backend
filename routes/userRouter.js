const router = require('express').Router();
const { updateUserInfo } = require("../services/userService");
const { parserJwt } = require("../middleware/authMiddleware");
const { fileProcessingMiddleware, upload } = require('../middleware/parseUploadFileMiddware')

router.patch('/update', parserJwt, upload.single('photo'), fileProcessingMiddleware, updateUserInfo);

module.exports = { router }
