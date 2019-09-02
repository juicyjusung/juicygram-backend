const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const path = require('path');
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const db = require('../../models');
const { isLoggedIn, isNotLoggedIn } = require('../middleware');

const router = express.Router();

AWS.config.update({
  region: 'ap-northeast-2',
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
});

const upload = multer({
  storage: multerS3({
    s3: new AWS.S3(),
    bucket: 'juicygram',
    key(req, file, cb) {
      cb(null, `origin/profile/${+new Date()}${path.basename(file.originalname)}`);
    },
  }),
  limits: { fileSize: 200 * 1024 * 1024 },
});

router.get('/', isLoggedIn, (req, res) => {
  const user = Object.assign({}, req.user.toJSON());
  delete user.password;
  return res.json(user);
});

// 회원정보 가져오기 GET /api/user/:username
router.get('/:username', isLoggedIn, async (req, res, next) => {
  try {
    const user = await db.User.findOne({
      where: { username: req.params.username },
      include: [{
        model: db.Post,
        as: 'posts',
        attributes: ['id'],
      }, {
        model: db.User,
        as: 'followings',
        attributes: ['id'],
      }, {
        model: db.User,
        as: 'followers',
        attributes: ['id'],
      }],
      attributes: ['id', 'username', 'avatarUrl'],
    });
    const jsonUser = user.toJSON();
    jsonUser.Posts = jsonUser.Posts ? jsonUser.Posts.length : 0;
    jsonUser.Followings = jsonUser.Followings ? jsonUser.Followings.length : 0;
    jsonUser.Followers = jsonUser.Followers ? jsonUser.Followers.length : 0;
    res.json(jsonUser);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 회원가입 POST /api/user/signup
router.post('/signup', isNotLoggedIn, async (req, res, next) => {
  try {
    const exUser = await db.User.findOne({
      where: {
        username: req.body.username,
      },
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

// 프로필 이미지 업로드 POST /api/user/profileimage
router.post('/profileimage', isLoggedIn, upload.single('file'), async (req, res, next) => {
  try {
    const url = req.file.location;
    const me = await db.User.findOne({
      where: { id: req.user.id },
    });
    me.update({
      avatarUrl: url,
    });
    return res.json(req.file);
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
            attributes: ['id', 'username'],
          }, {
            model: db.User,
            as: 'followings',
            attributes: ['id', 'username'],
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
      where: { id: parseInt(req.params.id, 10) || (req.user && req.user.id) || 0 },
    });
    const followings = await targetUser.getFollowings({
      attributes: ['id', 'username', 'avatar_url'],
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
      where: { id: parseInt(req.params.id, 10) || (req.user && req.user.id) || 0 },
    });
    const followers = await targetUser.getFollowers({
      attributes: ['id', 'username', 'avatar_url'],
    });
    return res.json(followers);
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

module.exports = router;
