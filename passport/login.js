const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('../models/User');

passport.use('login', new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, email, password, done) => {
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) return done(null, false, { error: 2 });
    if (!await user.matchPassword(password)) return done(null, false, { error: 3 });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}))

module.exports = passport;