const db = require('../models');

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ reason: '로그인이 필요합니다.' });
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ reason: '로그아웃하셔야 합니다.' });
};

exports.postExists = async (req, res, next) => {
  const post = await db.Post.findOne({ where: { id: req.params.pid } });
  if (!post) {
    return res.status(404).send('존재하지 않는 포스트 입니다');
  }
  return next();
};
