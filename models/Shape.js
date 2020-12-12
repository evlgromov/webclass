const mongoose = require('mongoose');

const Shape = new mongoose.Schema({
  canvas: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canvas',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['pencil'],
  },
  points: {
    type: [String],
    validate: [(arr) => arr.length === arr.filter((str) => /^-?\d+(.\d+)?:-?\d+(.\d+)?$/.test(str)).length, 'Неправильный формат'],
  }
}, { versionKey: false });

module.exports = mongoose.model('Shape', Shape);