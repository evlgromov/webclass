const User = require('../models/User');
const { ErrorResponse } = require('../utils/ErrorResponse');

exports.me = (req, res, next) => {
  console.log(req.user)
  return res.status(200).json({ success: true, data: req.user });
}

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  console.log(req.body)

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Пользователя с такой почтой не существует', 400));
  }

  if (!await user.matchPassword(password)) {
    return next(new ErrorResponse('Введён неверный пароль', 400));
  }

  sendJWTResponse(user, 200, res);
}

exports.register = async (req, res, next) => {
  const { email, password, firstname, lastname, role } = req.body;

  if (!password || !/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,24}$/.test(password)) {
    return next(new ErrorResponse('Пароль должен содержать от 6 до 24 символов, иметь 1 цифру, 1 заглавную и 1 строчную букву', 400));
  }

  const hashPassword = await User.hashPassword(password);

  const user = await User.create({ email, password: hashPassword, firstname, lastname, role });

  sendJWTResponse(user, 200, res);
}

exports.logout = (req, res, next) => {
  res.cookie('jwt_token', 'none', {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({ success: true, data: {} });
};

function sendJWTResponse(user, statusCode, res) {
  const jwt_token = user.getSignedJWT();

  const expires = new Date(
    Date.now() + process.env.JWT_COOKIE_EXPIRE * 1000 * 60 * 60 * 24
  );
  const options = { expires };

  res
    .status(statusCode)
    .cookie('jwt_token', jwt_token, options)
    .json({
      success: true,
      data: {
        user: { ...user.toObject(), password: undefined },
        jwt_token: {
          token: jwt_token,
          expires
        }
      }
    });
}