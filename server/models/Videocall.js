const mongoose = require('mongoose');

const Videocall = new mongoose.Schema({
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  start: {
    type: Date
  },
  end: {
    type: Date
  },
}, { versionKey: false });

module.exports = mongoose.model('Videocall', Videocall);