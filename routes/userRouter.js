const router = require('express').Router();
const { updateUserInfo, getNotificationList, updateNotificationState } = require("../services/userService");
const { parserJwt } = require("../middleware/authMiddleware");
const { fileProcessingMiddleware, upload } = require('../middleware/parseUploadFileMiddware')

router.patch('/update', parserJwt, upload.single('photo'), fileProcessingMiddleware, updateUserInfo);
router.get('/notifications', parserJwt, getNotificationList);
router.patch('/notifications/update/:id', parserJwt, updateNotificationState);

module.exports = { router }
