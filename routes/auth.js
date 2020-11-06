const express = require('express');
const passport = require('passport');

const controller = require('../controllers/auth');

const router = express.Router();

router.get('/me', passport.authenticate('jwt', { session: false }), controller.me);
router.post('/login', controller.login);
router.post('/register', controller.register);
router.get('/logout', passport.authenticate('jwt', { session: false }), controller.logout);

module.exports = router;