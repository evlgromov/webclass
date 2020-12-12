const mongoose = require('mongoose');

const Layer = new mongoose.Schema({
  canvas: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canvas',
    required: true
  },
}, {
  versionKey: false,
  timestamps: {
    createdAt: 'created_at'
  }
});

module.exports = mongoose.model('Layer', Layer);