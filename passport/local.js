const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcrypt');
const db = require('../models');

module.exports = () => {
  passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
  }, async (id, password, done) => {
    try {
      const user = await db.User.findOne({ where: { username: id } });
      if (!user) {
        return done(null, false, { reason: '존재하지 않는 사용자입니다!' });
      }
      const result = await bcrypt.compare(password, user.password);
      if (result) {
        return done(null, user);
      } else {
        return done(null, false, { reason: '비밀번호가 틀렸습니다!' });
      }
    } catch (e) {
      console.error(e);
      return done(e);
    }
  }));
};