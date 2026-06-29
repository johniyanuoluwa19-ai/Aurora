import { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import PostService from '../services/post.service';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

export class PostController {
  /**
   * GET /api/posts/feed
   */
  static async getFeed(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const posts = await PostService.getFeed(req.userId, limit, offset);
      res.json({
        posts,
        pagination: { limit, offset, count: posts.length },
      });
    } catch (error: any) {
      logger.error('Get feed error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/posts/:id
   */
  static async getPost(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const post = await PostService.getPost(id, req.userId);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      res.json(post);
    } catch (error: any) {
      logger.error('Get post error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/posts
   */
  static async createPost(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { content, media_urls, media_types, visibility } = req.body;

      const post = await PostService.createPost({
        user_id: req.userId,
        content,
        media_urls,
        media_types,
        visibility,
      });

      res.status(201).json(post);
    } catch (error: any) {
      logger.error('Create post error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * PUT /api/posts/:id
   */
  static async updatePost(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const { content, visibility } = req.body;

      const post = await PostService.updatePost(id, req.userId, { content, visibility });

      res.json(post);
    } catch (error: any) {
      logger.error('Update post error:', error);
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/posts/:id
   */
  static async deletePost(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;

      await PostService.deletePost(id, req.userId);

      res.json({ message: 'Post deleted successfully' });
    } catch (error: any) {
      logger.error('Delete post error:', error);
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/posts/:id/like
   */
  static async likePost(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;

      const likesCount = await PostService.likePost(id, req.userId);

      res.json({ message: 'Post liked', likes_count: likesCount });
    } catch (error: any) {
      logger.error('Like post error:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/posts/:id/like
   */
  static async unlikePost(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;

      const likesCount = await PostService.unlikePost(id, req.userId);

      res.json({ message: 'Post unliked', likes_count: likesCount });
    } catch (error: any) {
      logger.error('Unlike post error:', error);
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/posts/:id/likes
   */
  static async getPostLikes(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const likes = await PostService.getPostLikes(id, limit);

      res.json(likes);
    } catch (error: any) {
      logger.error('Get post likes error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/posts/:id/comments
   */
  static async createComment(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;
      const { content, parent_comment_id } = req.body;

      const comment = await PostService.createComment({
        post_id: id,
        user_id: req.userId,
        content,
        parent_comment_id,
      });

      res.status(201).json(comment);
    } catch (error: any) {
      logger.error('Create comment error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/posts/:id/comments
   */
  static async getComments(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const comments = await PostService.getComments(id, limit, offset);

      res.json({
        comments,
        pagination: { limit, offset, count: comments.length },
      });
    } catch (error: any) {
      logger.error('Get comments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * DELETE /api/posts/comments/:id
   */
  static async deleteComment(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { id } = req.params;

      await PostService.deleteComment(id, req.userId);

      res.json({ message: 'Comment deleted successfully' });
    } catch (error: any) {
      logger.error('Delete comment error:', error);
      if (error.message.includes('Unauthorized')) {
        return res.status(403).json({ error: error.message });
      }
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/posts/search
   */
  static async searchPosts(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const q = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const posts = await PostService.searchPosts(q, limit, offset);

      res.json({
        posts,
        pagination: { limit, offset, count: posts.length },
      });
    } catch (error: any) {
      logger.error('Search posts error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

export default PostController;