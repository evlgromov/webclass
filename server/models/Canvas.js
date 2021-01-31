const mongoose = require('mongoose');
const Shape = require('./Shape');

const Canvas = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  access: {
    type: Number,
    required: true,
    enum: [1, 2, 3]
    /**
     * ДОСТУП ДЛЯ ГОСТЕЙ
     * 1. Закрыта для всех
     * 2. Может просматривать
     * 3. Может редактировать
     */
  },
  accessUsers: {
    type: [{
      email: {
        type: String,
        required: true,
        match: [
          /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
          'Пожалуйста укажите корректную электронную почту',
        ],
      },
      canChange: Boolean
    }]
  }
}, { 
  versionKey: false,
  toJSON: { virtuals: true }
});

Canvas.virtual('layers', {
  ref: 'Layer',
  localField: '_id',
  foreignField: 'canvas',
  justOne: false,
})

Canvas.pre('remove', async function(next) {
    await Shape.deleteMany({canvas: this._id});

    next();
});

module.exports = mongoose.model('Canvas', Canvas);