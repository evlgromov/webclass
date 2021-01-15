const express = require('express');
const passport = require('passport');

const controller = require('../controllers/chats');

const router = express.Router();

router.get('/', passport.authenticate('jwt', { session: false }), controller.getChats);
router.get('/:id/messages', passport.authenticate('jwt', { session: false }), controller.getMessages);
router.post('/', passport.authenticate('jwt', { session: false }), controller.createChat);

module.exports = router;