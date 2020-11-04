const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Пожалуйста укажите электронную почту'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Пожалуйста укажите корректную электронную почту',
    ],
  },
  firstname: {
    type: String,
    required: [true, 'Пожалуйста укажите имя'],
    max: 36
  },
  lastname: {
    type: String,
    required: [true, 'Пожалуйста укажите фамилию'],
    max: 36
  },
  role: {
    type: String,
    emun: ['student', 'teacher', 'admin'],
    default: 'student',
    required: [true, 'Пожалуйста укажите роль'],
  },
  password: {
    type: String,
    required: [true, 'Пожалуйста укажите пароль'],
    select: false,
  },
}, { versionKey: false });

User.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
}

User.methods.hashPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

module.exports = mongoose.model('User', User);