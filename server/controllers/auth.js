const User = require('../models/User');

exports.me = (req, res, next) => {
  return res.status(200).json({ success: true, data: req.user });
}

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(400).json({success: false, error: {errors: {email: {msg: 'Пользователя с такой почтой не существует'}}, message: 'Bad request'}});
  }

  if (!await user.matchPassword(password)) {
    return res.status(400).json({success: false, error: {errors: {password: {msg: 'Введен неправильный пароль'}}, message: 'Bad request'}});
  }

  sendJWTResponse(user, 200, res);
}

exports.register = async (req, res, next) => {
  const { email, password, firstname, lastname, confirmPassword} = req.body;

  const hashPassword = await User.hashPassword(password);

  const user = await User.create({ email, password: hashPassword, firstname, lastname});

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