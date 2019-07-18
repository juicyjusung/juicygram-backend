const express = require('express');
const db = require('../../models');
const { isLoggedIn } = require('../middleware');

const router = express.Router();

// 게시글 작성
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
          attributes: ['username'],
        },
        {
          model: db.User,
          as: 'likers',
        }
      ],
    });
    res.json(post);
  } catch (e) {
    console.error(e);
    next(e);
  }
});

// 게시글 가져오기
router.get('/:pid', async (req, res, next) => {
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

module.exports = router;
