const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../../models');
const { isLoggedIn, isNotLoggedIn } = require('../middleware');
const passport = require('passport');
const router = express.Router();

router.get('/', isLoggedIn, (req, res) => {
  res.json(req.user);
});

router.post('/signup', isNotLoggedIn, async (req, res, next) => {
  console.log(req.body);
  try {
    const exUser = await db.User.findOne({
      where: {
        username: req.body.username,
      }
    });
    if (exUser) {
      return res.status(403).send('이미 사용중인 아이디 입니다.');
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    const newUser = await db.User.create({
      username: req.body.username,
      password: hashedPassword,
      email: req.body.email,
    });
    return res.json(newUser);
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

router.post('/login', isNotLoggedIn, async (req, res, next) => {
  console.log(req.cookie);
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error(err);
      return next(err);
    }
    if (info) {
      return res.status(401).json(info);
    }
    return req.login(user, async (loginErr) => {
      if (loginErr) {
        console.error(loginErr);
        return next(loginErr);
      }
      try {
        await db.User.update({
          isOnline: true,
        }, {
          where: { username: user.username },
        });
        const fullUser = await db.User.findOne({
          where: { username: user.username },
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
          attributes: ['id', 'username', 'email', 'avatar_url', 'status_message', 'is_online'],
        });
        return res.json(fullUser);
      } catch (e) {
        console.error(e);
      }
    });
  })(req, res, next);
});

router.post('/logout', isLoggedIn, async (req, res) => {
  await db.User.update({
    isOnline: false,
  }, {
    where: { id: req.session.passport.user },
  });
  req.session.destroy();
  req.logout();
  res.send('ok');
});

module.exports = router;