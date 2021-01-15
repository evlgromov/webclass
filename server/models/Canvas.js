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
     * 1.закрытая для всех - по умолчанию, на закрытых досках учитель подготавливает урок
     * 2.открытая по приглашению - тут учитель должен вручную выбирать студентов, 
     *   выбранные студенты могут заходить на доску по ссылке. 
     *   Каждому ученику учитель может указать могут ли они рисовать на доске или только просмотр
     * 3.открытая для всех - эти доски доступны по ссылке всем, даже незалогиненным в систему юзерам
     */
  },
  accessUsers: {
    type: [{
      _id: mongoose.Schema.Types.ObjectId,
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