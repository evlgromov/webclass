const mongoose = require('mongoose');

const Shape = new mongoose.Schema({
  layer: {
    type: Number,
    ref: 'Layer',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['pencil', 'img', 'eraser'],
  },
  points: {
    type: [String],
    validate: [(arr) => arr.length === arr.filter((str) => /^-?\d+(.\d+)?:-?\d+(.\d+)?$/.test(str)).length, 'Неправильный формат'],
  },
  src: {
    type: String
  },
  x: {
    type: Number
  },
  y: {
    type: Number
  },
  width: {
    type: Number
  },
  height: {
    type: Number
  }
}, { versionKey: false });

module.exports = mongoose.model('Shape', Shape);