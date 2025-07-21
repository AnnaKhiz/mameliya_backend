const router = require('express').Router();
const {
	signUpUser,
	signInUser,
	logOutUser,
	checkIsTokenExpired,
	checkIsPasswordCorrect
} = require('../services/authService');
const { parserJwt } = require("../middleware/authMiddleware");


// USER
router.post('/register', signUpUser);
router.post('/login', signInUser);
router.post('/password-check', parserJwt, checkIsPasswordCorrect);
router.get('/logout', logOutUser);
router.get('/check-auth', parserJwt, checkIsTokenExpired);

module.exports = { router }
