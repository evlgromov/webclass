const express = require('express');

const auth = require('./auth');
const students = require('./students');

const router = express.Router();

router.use('/api/v1/auth', auth);
router.use('/api/v1/students', students);

module.exports = router;