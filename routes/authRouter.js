const router = require('express').Router();
const { signUpUser, signInUser } = require('../services/authService');

// GET
router.post('/register', signUpUser);
router.post('/login', signInUser);

module.exports = { router }
