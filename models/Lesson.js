const mongoose = require('mongoose');

const Chat = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  start: {
    type: Date
  },
  end: {
    type: Date
  },
}, { versionKey: false });

module.exports = mongoose.model('Chat', Chat);