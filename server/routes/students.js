const express = require('express');
const passport = require('passport');

const controller = require('../controllers/students');

const router = express.Router();

router.get('/', passport.authenticate('jwt', { session: false }), controller.getStudents);

module.exports = router;