const express = require('express');

const { me, authenticate } = require('../controllers/auth');

const router = express.Router();

router.get('/me', me);
router.post('/login', authenticate('login'));
router.post('/register', authenticate('register'));

module.exports = router;