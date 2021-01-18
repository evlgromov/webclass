const { checkSchema, validationResult, check } = require('express-validator');

const User = require('../../models/User');
const { ErrorResponse } = require('../../utils/ErrorResponse');

module.exports.login = [
  checkSchema({
    email: {
      in: ['body'],
      exists: {
        errorMessage: 'Почта не указана'
      },
      isEmail: {
        errorMessage: 'Неправильная почта'
      },
      customSanitizer: {
        options: (value) => {
          if (!value) {
            return '';
          }
          return value.toLowerCase();
        }
      }
    },
    password: {
      in: ['body'],
      notEmpty: {
        errorMessage: 'Пароль не указан'
      },
      exists: {
        errorMessage: 'Пароль не указан'
      }
    }
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(errors.mapped(), 400));
    }
    next();
  }
];

module.exports.register = [
  checkSchema({
    email: {
      in: ['body'],
      exists: {
        errorMessage: 'Почта не указана'
      },
      custom: {
        options: (value) => {
          return new Promise((resolve, reject) => {
            if (!value) {
              reject();
            }
            User.findOne({ email: value.toLowerCase() })
              .then((user) => {
                if (!user) {
                  return resolve();
                }
                reject();
              }, (err) => {
                reject();
              })
          });
        },
        errorMessage: 'Такая почта уже используется'
      },
      customSanitizer: {
        options: (value) => {
          if (!value) {
            return '';
          }
          return value.toLowerCase();
        }
      },
      isEmail: {
        errorMessage: 'Неправильная почта'
      },
    },
    password: {
      in: ['body'],
      exists: {
        errorMessage: 'Пароль не указан'
      },
      matches: {
        options: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,24}$/,
        errorMessage: 'Пароль должен содержать от 6 до 24 символов, иметь 1 цифру, 1 заглавную и 1 строчную букву'
      }
    },
    firstname: {
      in: ['body'],
      isString: {
        errorMessage: 'Неправильное имя'
      },
      exists: {
        errorMessage: 'Имя не указано'
      },
      isLength: {
        options: {
          min: 2,
          max: 36
        },
        errorMessage: 'Имя должно содержать от 2 до 36 символов'
      }
    },
    lastname: {
      in: ['body'],
      isString: {
        errorMessage: 'Неправильная фамилия'
      },
      exists: {
        errorMessage: 'Фамилия не указана'
      },
      isLength: {
        options: {
          min: 2,
          max: 36
        },
        errorMessage: 'Фамилия должна содержать от 2 до 36 символов'
      }
    },
    role: {
      in: ['body'],
      matches: {
        options: [/^(student|teacher)$/],
        errorMessage: "Неправильная роль"
      }
    }
  }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ErrorResponse(errors.mapped(), 400));
    }
    next();
  }
];