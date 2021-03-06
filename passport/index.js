const passport = require('passport');
const db = require('../models');
const local = require('./local');

module.exports = () => {
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await db.User.findOne({
        where: { id },
        include: [{
          model: db.Post,
          as: 'posts',
          attributes: ['id'],
        }, {
          model: db.User,
          as: 'followers',
          attributes: ['id'],
        }, {
          model: db.User,
          as: 'followings',
          attributes: ['id'],
        }],
      });
      return done(null, user);
    } catch (e) {
      console.error(e);
      return done(e);
    }
  });

  local();
};
