const express = require('express');
const db = require('../../models');
const { isLoggedIn } = require('../middleware');

const router = express.Router();

// 게시글 작성 POST /api/post
router.post('/', isLoggedIn, async (req, res, next) => {
  try {
    const hashtags = req.body.content.match(/#[^\s]+/g);
    const newPost = await db.Post.create({
      content: req.body.content,
      userId: req.user.id,
    });
    if (hashtags) {
      const result = await Promise.all(hashtags.map(tag => db.Hashtag.findOrCreate({
        where: { name: tag.slice(1).toLowerCase() },
      })));
      await newPost.addHashtags(result.map((r) => {
        return (r[0]);
      }));
    }

    const post = await db.Post.findOne({
      where: { id: newPost.id },
      include: [
        {
          model: db.Image,
        },
        {
          model: db.User,
          attributes: ['id', 'username'],
        },
        {
          model: db.User,
          as: 'likers',
        },
      ],
    });
    res.json(post);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 게시글 가져오기 GET /api/post/:pid
router.get('/:pid', isLoggedIn, async (req, res, next) => {
  try {
    const post = await db.Post.findOne({
      where: { id: req.params.pid },
      include: [{
        model: db.User,
        attributes: ['id', 'username'],
      }, {
        model: db.Image,
      }, {
        model: db.User,
        as: 'likers',
        attributes: ['id', 'username']
      }],
    });
    res.json(post);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 게시글 수정하기  PATCH /api/post/:pid
router.patch('/:pid', isLoggedIn, async (req, res, next) => {
  try {
    const prevPost = await db.Post.findOne({
      where: { id: req.params.pid },
    });
    if (!prevPost) {
      return res.status(404).send('존재하지 않는 포스트 입니다');
    }
    if (prevPost.userId !== req.user.id) {
      return res.status(405).send('사용자가 옳바르지 않습니다.');
    }
    const prevHashtags = await prevPost.getHashtags();
    await prevPost.removeHashtags(prevHashtags);
    const hashtags = req.body.content.match(/#[^\s]+/g);
    const newPost = await prevPost.update({
      content: req.body.content,
    }, {
      where: { id: req.params.pid },
    });
    if (hashtags) {
      const result = await Promise.all(hashtags.map(tag => db.Hashtag.findOrCreate({
        where: { name: tag.slice(1).toLowerCase() },
      })));
      await newPost.addHashtags(result.map(r => r[0]));
    }
    const post = await db.Post.findOne({
      where: { id: newPost.id },
      include: [
        {
          model: db.Image,
        },
        {
          model: db.User,
          attributes: ['id', 'username'],
        },
        {
          model: db.User,
          as: 'likers',
        },
      ],
    });
    return res.json(post);
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

// 게시글 삭제하기 DELETE /api/post/:pid
router.delete('/:pid', isLoggedIn, async (req, res, next) => {
  try {
    const post = await db.Post.findOne({ where: { id: req.params.pid } });
    if (!post) {
      return res.status(404).send('존재하지 않는 포스트 입니다');
    }
    if (post.userId !== req.user.id) {
      return res.status(405).send('사용자가 옳바르지 않습니다.');
    }
    await post.destroy();
    return res.send('게시글이 삭제되었습니다.');
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

// 게시글 좋아요 POST /api/post/:pid/like
router.post('/:pid/like', isLoggedIn, async (req, res, next) => {
  try {
    const post = await db.Post.findOne({ where: { id: req.params.pid } });
    if (!post) {
      return res.status(404).send('존재하지 않는 포스트 입니다');
    }
    await post.addLiker(req.user.id);
    return res.json({ userId: req.user.id });
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

// 게시글 좋아요 취소 POST /api/post/:pid/like
router.delete('/:pid/like', isLoggedIn, async (req, res, next) => {
  try {
    const post = await db.Post.findOne({ where: { id: req.params.pid } });
    if (!post) {
      return res.status(404).send('존재하지 않는 포스트 입니다');
    }
    await post.removeLiker(req.user.id);
    return res.json({ userId: req.user.id });
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

module.exports = router;
