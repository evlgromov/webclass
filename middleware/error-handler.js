const { ErrorResponse } = require('../utils/ErrorResponse');

module.exports = (err, req, res, next) => {
  let error = {};

  error.statusCode = err.statusCode;
  error.message = err.message;

  if (err.code === 11000) {
    error = new ErrorResponse('Введено повторяющееся значение поля', 400);
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .filter((val) => val)
      .join('; ');
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Ошибка сервера'
  })
}