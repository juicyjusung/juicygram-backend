const express = require('express');
const db = require('../../models');
const { isLoggedIn, postExists } = require('../middleware');

const router = express.Router();

// 댓글 가져오기 /api/comment/:pid
router.get('/:pid', isLoggedIn, postExists, async (req, res, next) => {
  try {
    const comments = await db.Comment.findAll({
      where: {
        postId: req.params.pid,
      },
      order: [['created_at', 'ASC']],
      include: [{
        model: db.User,
        attributes: ['id', 'username'],
      }],
    });
    return res.json(comments);
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

// 댓글 작성하기 POST /api/comment/:pid
router.post('/:pid', isLoggedIn, postExists, async (req, res, next) => {
  try {
    const post = await db.Post.findOne({ where: { id: req.params.pid } });
    if (!post) {
      return res.status(404).send('존재하지 않는 포스트 입니다');
    }

    const newComment = await db.Comment.create({
      postId: post.id,
      userId: req.user.id,
      content: req.body.content,
    });
    await post.addComment(newComment.id);
    const comment = await db.Comment.findOne({
      where: {
        id: newComment.id,
      },
      include: [{
        model: db.User,
        attributes: ['id', 'username'],
      }],
    });
    return res.json(comment);
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

// 댓글 삭제 DELETE /api/comment/:pid {"commentId"}
router.delete('/:pid', isLoggedIn, async (req, res, next) => {
  try {
    const post = await db.Post.findOne({ where: { id: req.params.pid } });
    if (!post) {
      return res.status(404).send('존재하지 않는 포스트 입니다');
    }
    const comment = await db.Comment.findOne({
      where: {
        id: req.body.commentId,
        postId: req.params.pid,
      },
    });
    if (!comment) {
      return res.status(404).send('존재하지 않는 댓글 입니다');
    }
    if (post.userId !== req.user.id) {
      return res.status(405).send('사용자가 옳바르지 않습니다.');
    }
    comment.destroy();
    const comments = await db.Comment.findAll({
      where: {
        postId: req.params.pid,
      },
      order: [['created_at', 'ASC']],
      include: [{
        model: db.User,
        attributes: ['id', 'username'],
      }],
    });
    return res.json(comments);
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

// 댓글 수정 PATCH /api/comment/:pid {"commentId"}
router.patch('/:pid', isLoggedIn, async (req, res, next) => {
  try {
    const post = await db.Post.findOne({ where: { id: req.params.pid } });
    if (!post) {
      return res.status(404).send('존재하지 않는 포스트 입니다');
    }
    const updatedComment = await db.Comment.update({
      content: req.body.content,
    }, {
      where: {
        id: req.body.commentId,
        postId: req.params.pid,
        userId: req.user.id,
      },
    });
    if (!updatedComment) {
      return res.status(404).send('댓글이 변경되지 않았습니다');
    }
    return res.send(updatedComment);
  } catch (e) {
    console.error(e);
    return next(e);
  }
});

module.exports = router;
