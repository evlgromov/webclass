const passport = require('passport');

const { ErrorResponse } = require('../utils/ErrorResponse');

exports.me = (req, res, next) => {
  return res.status(200).json({ success: true, data: req.user });
}

exports.authenticate = (strategyName) => (req, res, next) => passport.authenticate(strategyName, (err, user, info) => {
  if (err) return next(err);

  if (info) {
    if (info.error) {
      switch (info.error) {
        case 1:
          return next(new ErrorResponse('Пользователь с такой почтой уже существует', 400));
        case 2:
          return next(new ErrorResponse('Пользователя с такой почтой не существует', 400));
        case 3:
          return next(new ErrorResponse('Введён неверный пароль', 400));
      }
    }
    if (info.message === 'Missing credentials') {
      return next(new ErrorResponse('Все поля должны быть заполнены', 400));
    }
  }

  req.login(user, (err) => {
    if (err) {
      return next(err);
    }

    return res.status(201).json({ success: true, data: { ...user.toObject(), password: undefined } })
  });
})(req, res, next);