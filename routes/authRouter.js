const router = require('express').Router();
const { signUpUser, signInUser, logOutUser } = require('../services/authService');
const {parserJwt} = require("../middleware/authMiddleware");

// GET
router.post('/register', signUpUser);
router.post('/login', signInUser);
router.get('/logout', logOutUser);

module.exports = { router }
