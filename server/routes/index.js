const express = require('express');

const auth = require('./auth');
const students = require('./students');
const users = require('./users');
const canvases = require('./canvases');
const lessons = require('./lessons');
const chats = require('./chats');

const router = express.Router();

router.use('/api/v1/auth', auth);
router.use('/api/v1/students', students);
router.use('/api/v1/users', users);
router.use('/api/v1/canvases', canvases);
// router.use('/api/v1/lessons', lessons);
router.use('/api/v1/chats', chats);

module.exports = router;