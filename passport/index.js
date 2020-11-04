const passport = require('passport');

const User = require('../models/User');

const login = require('./login');
const register = require('./register');

passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

module.exports = passport;