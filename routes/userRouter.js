const router = require('express').Router();
const { updateUserInfo } = require("../services/userService");
const { parserJwt } = require("../middleware/authMiddleware");

router.patch('/update', parserJwt, updateUserInfo);

module.exports = { router }
