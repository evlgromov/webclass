const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

const Layer = new mongoose.Schema({
  canvas: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Canvas',
    required: true
  },
}, { versionKey: false });

Layer.plugin(autoIncrement.plugin, 'Layer');

module.exports = mongoose.model('Layer', Layer);