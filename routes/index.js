const express = require('express');

const auth = require('./auth');
const students = require('./students');
const lessons = require('./lessons');

const router = express.Router();

router.use('/api/v1/auth', auth);
router.use('/api/v1/students', students);
router.use('/api/v1/lessons', lessons);

module.exports = router;