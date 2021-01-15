const express = require('express');
const passport = require('passport');

const controller = require('../controllers/lessons');

const router = express.Router();

router.get('/', passport.authenticate('jwt', { session: false }), controller.getLessons);

module.exports = router;