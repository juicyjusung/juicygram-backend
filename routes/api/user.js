const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const db = require('../../models');
const { isLoggedIn, isNotLoggedIn } = require('../middleware');

const router = express.Router();

router.get('/', isLoggedIn, (req, res) => {
  const user = Object.assign({}, req.user.toJSON());
  delete user.password;
  return res.json(user);
});

// 회원가입 POST /api/user/signup
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

// 로그인 POST /api/user/login
router.post('/login', isNotLoggedIn, async (req, res, next) => {
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
        return next(e);
      }
    });
  })(req, res, next);
});

// 로그아웃 POST /api/user/logout
router.post('/logout', isLoggedIn, async (req, res) => {
  await db.User.update({
    isOnline: false,
  }, {
    where: { id: req.session.passport.user },
  });
  req.logout();
  req.session.destroy();
  res.send('ok');
});

// 유저 팔로우 POST /api/user/:uid/follow
router.post('/:uid/follow', isLoggedIn, async (req, res, next) => {
  try {
    const me = await db.User.findOne({
      where: { id: req.user.id },
    });
    await me.addFollowing(req.params.uid);
    return res.send(req.params.uid);
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

// 유저 언팔로우 DELETE /api/user/:uid/follow
router.delete('/:uid/follow', isLoggedIn, async (req, res, next) => {
  try {
    const me = await db.User.findOne({
      where: { id: req.user.id },
    });
    me.removeFollowing(req.params.uid);
    return res.send(req.params.uid);
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

// 유저 팔로잉 목록 GET /api/user/:uid/followings
router.get('/:uid/followings', isLoggedIn, async (req, res, next) => {
  try {
    const targetUser = await db.User.findOne({
      where: { id: req.params.uid },
    });
    const followings = await targetUser.getFollowings({
      attributes: ['id', 'username'],
    });
    return res.json(followings);
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

// 유저 팔로워 목록 GET /api/user/:uid/followers
router.get('/:uid/followers', isLoggedIn, async (req, res, next) => {
  try {
    const targetUser = await db.User.findOne({
      where: { id: req.params.uid },
    });
    const followers = await targetUser.getFollowers({
      attributes: ['id', 'username'],
    });
    return res.json(followers);
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

module.exports = router;
