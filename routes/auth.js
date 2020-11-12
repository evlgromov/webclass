const express = require('express');
const passport = require('passport');

const controller = require('../controllers/auth');

const validation = require('../middleware/validation/userValidator')

const router = express.Router();

router.get('/me', passport.authenticate('jwt', { session: false }), controller.me);
router.post('/login', validation.login, controller.login);
router.post('/register', validation.register, controller.register);
router.get('/logout', passport.authenticate('jwt', { session: false }), controller.logout);

module.exports = router;