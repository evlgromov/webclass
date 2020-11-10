const { ErrorResponse } = require("../utils/ErrorResponse");

module.exports = (roles) => (req, res, next) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  if (roles.indexOf(req.user.role) === -1) {
    return next(new ErrorResponse('У вас нет доступа', 403));
  }

  next();
}