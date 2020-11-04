const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('../models/User');

passport.use('register', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, email, password, done) => {
  let user;

  try {
    user = await User.findOne({ email });
  } catch (err) {
    return done(err);
  }

  if (user) {
    return done(null, false, { error: 1 })
  } else {
    const newUser = new User();

    newUser.email = email
    // /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,24}$/,
    //   'Пароль должен содержать от 6 до 24 символов, иметь 1 цифру, 1 заглавную и 1 строчную букву',
    newUser.password = await newUser.hashPassword(password);
    newUser.firstname = req.body.firstname;
    newUser.lastname = req.body.lastname;
    newUser.role = req.body.role;

    try {
      await newUser.save();
    } catch (err) {
      return done(err);
    }

    return done(null, newUser);
  }
}))

module.exports = passport;