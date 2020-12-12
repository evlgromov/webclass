const express = require('express');
const passport = require('passport');

const controller = require('../controllers/users');

const router = express.Router();

router.get('/', passport.authenticate('jwt', { session: false }), controller.getUsers);

module.exports = router;