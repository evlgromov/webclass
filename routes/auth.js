const express = require('express');
const passport = require('passport');

const controller = require('../controllers/auth');

const validation = require('../middleware/validation/userValidator')

const router = express.Router();

router.post('/login', validation.login, controller.login);
router.post('/register', validation.register, controller.register);

router.use(passport.authenticate('jwt', { session: false }));

router.get('/me', controller.me);
router.get('/logout', controller.logout);

module.exports = router;