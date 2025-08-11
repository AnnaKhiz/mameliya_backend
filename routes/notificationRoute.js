const router = require('express').Router();
const { parserJwt } = require("../middleware/authMiddleware");
const {getNotificationList, updateNotificationState} = require("../services/notificationService");

router.get('/', parserJwt, getNotificationList);
router.patch('/update/:id', parserJwt, updateNotificationState);

module.exports = { router }
