import { Router } from 'express';
import PostController from '../controllers/post.controller';
import { verifyToken } from '../middleware/auth.middleware';
import {
  createPostValidator,
  updatePostValidator,
  createCommentValidator,
  paginationValidator,
  searchValidator,
} from '../validators/post.validator';

const router = Router();

// Protected routes (requires authentication)
router.get('/feed', verifyToken, paginationValidator, PostController.getFeed);
router.post('/', verifyToken, createPostValidator, PostController.createPost);
router.get('/search', verifyToken, searchValidator, PostController.searchPosts);

// Individual post routes
router.get('/:id', verifyToken, PostController.getPost);
router.put('/:id', verifyToken, updatePostValidator, PostController.updatePost);
router.delete('/:id', verifyToken, PostController.deletePost);

// Like routes
router.post('/:id/like', verifyToken, PostController.likePost);
router.delete('/:id/like', verifyToken, PostController.unlikePost);
router.get('/:id/likes', verifyToken, PostController.getPostLikes);

// Comment routes
router.post('/:id/comments', verifyToken, createCommentValidator, PostController.createComment);
router.get('/:id/comments', verifyToken, paginationValidator, PostController.getComments);
router.delete('/comments/:id', verifyToken, PostController.deleteComment);

export default router;