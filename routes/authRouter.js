const router = require('express').Router();
const { signInUser } = require('../services/authService');

// GET
router.post('/login', signInUser);

module.exports = { router }
