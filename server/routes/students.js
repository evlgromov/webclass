const express = require('express');
const passport = require('passport');

const auth = require('../middleware/auth');

const controller = require('../controllers/students');

const router = express.Router();

router.get('/', passport.authenticate('jwt', { session: false }), auth('teacher'), controller.getStudents);

module.exports = router;