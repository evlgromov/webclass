const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');

const User = require('../models/User');

module.exports = (passport) => {
  const opts = {};
  opts.jwtFromRequest = ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    (req) => {
      let token = null;
      if (req && req.cookies) {
        token = req.cookies['jwt_token']
      }
      return token;
    }
  ]);
  opts.secretOrKey = process.env.JWT_SECRET;
  passport.use(new JwtStrategy(opts, (playload, done) => {
    User.findById(playload._id, (err, user) => {
      if (err) return done(err);
      if (user) return done(null, user);
      done(null, false);
    });
  }))
}