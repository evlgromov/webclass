const mongoose = require('mongoose');

const Message = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  text: {
    type: String,
    maxlength: 10000,
    required: true
  },
  read: {
    type: Boolean
  }
}, { versionKey: false });

module.exports = mongoose.model('Message', Message);