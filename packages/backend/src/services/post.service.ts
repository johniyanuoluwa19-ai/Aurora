import PostModel, { PostWithAuthor } from '../models/post.model';
import LikeModel from '../models/like.model';
import CommentModel from '../models/comment.model';
import logger from '../utils/logger';

export class PostService {
  /**
   * Create a new post
   */
  static async createPost(data: {
    user_id: string;
    content: string;
    media_urls?: string[];
    media_types?: string[];
    visibility?: string;
  }): Promise<PostWithAuthor | null> {
    try {
      if (!data.content || data.content.trim().length === 0) {
        throw new Error('Post content cannot be empty');
      }

      if (data.content.length > 5000) {
        throw new Error('Post content exceeds maximum length');
      }

      const post = await PostModel.create(data);
      logger.info(`Post created: ${post.id} by user ${data.user_id}`);

      return PostModel.findByIdWithUser(post.id, data.user_id);
    } catch (error: any) {
      logger.error('Create post error:', error);
      throw error;
    }
  }

  /**
   * Get feed for user
   */
  static async getFeed(userId: string, limit: number = 20, offset: number = 0): Promise<PostWithAuthor[]> {
    try {
      if (limit > 100) limit = 100;
      if (offset < 0) offset = 0;

      return await PostModel.getFeed(userId, limit, offset);
    } catch (error: any) {
      logger.error('Get feed error:', error);
      throw error;
    }
  }

  /**
   * Get post by ID
   */
  static async getPost(postId: string, userId?: string): Promise<PostWithAuthor | null> {
    try {
      return await PostModel.findByIdWithUser(postId, userId);
    } catch (error: any) {
      logger.error('Get post error:', error);
      throw error;
    }
  }

  /**
   * Update post
   */
  static async updatePost(postId: string, userId: string, data: Partial<any>): Promise<PostWithAuthor | null> {
    try {
      const post = await PostModel.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      if (post.user_id !== userId) {
        throw new Error('Unauthorized to update this post');
      }

      if (data.content && data.content.length > 5000) {
        throw new Error('Post content exceeds maximum length');
      }

      await PostModel.update(postId, data);
      logger.info(`Post updated: ${postId}`);

      return PostModel.findByIdWithUser(postId, userId);
    } catch (error: any) {
      logger.error('Update post error:', error);
      throw error;
    }
  }

  /**
   * Delete post
   */
  static async deletePost(postId: string, userId: string): Promise<void> {
    try {
      const post = await PostModel.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      if (post.user_id !== userId) {
        throw new Error('Unauthorized to delete this post');
      }

      await PostModel.delete(postId);
      logger.info(`Post deleted: ${postId}`);
    } catch (error: any) {
      logger.error('Delete post error:', error);
      throw error;
    }
  }

  /**
   * Like a post
   */
  static async likePost(postId: string, userId: string): Promise<number> {
    try {
      const post = await PostModel.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      const like = await LikeModel.create(userId, postId);
      if (!like) {
        throw new Error('Already liked this post');
      }

      logger.info(`Post liked: ${postId} by user ${userId}`);

      return post.likes_count + 1;
    } catch (error: any) {
      logger.error('Like post error:', error);
      throw error;
    }
  }

  /**
   * Unlike a post
   */
  static async unlikePost(postId: string, userId: string): Promise<number> {
    try {
      const post = await PostModel.findById(postId);
      if (!post) {
        throw new Error('Post not found');
      }

      await LikeModel.delete(userId, postId);
      logger.info(`Post unliked: ${postId} by user ${userId}`);

      return Math.max(post.likes_count - 1, 0);
    } catch (error: any) {
      logger.error('Unlike post error:', error);
      throw error;
    }
  }

  /**
   * Get likes for a post
   */
  static async getPostLikes(postId: string, limit: number = 10): Promise<any[]> {
    try {
      if (limit > 100) limit = 100;
      return await LikeModel.listByPost(postId, limit);
    } catch (error: any) {
      logger.error('Get post likes error:', error);
      throw error;
    }
  }

  /**
   * Create a comment
   */
  static async createComment(data: {
    post_id: string;
    user_id: string;
    content: string;
    parent_comment_id?: string;
  }): Promise<any> {
    try {
      if (!data.content || data.content.trim().length === 0) {
        throw new Error('Comment content cannot be empty');
      }

      if (data.content.length > 1000) {
        throw new Error('Comment content exceeds maximum length');
      }

      const post = await PostModel.findById(data.post_id);
      if (!post) {
        throw new Error('Post not found');
      }

      const comment = await CommentModel.create(data);
      await PostModel.incrementCommentCount(data.post_id);

      logger.info(`Comment created: ${comment.id} on post ${data.post_id}`);

      return CommentModel.findById(comment.id);
    } catch (error: any) {
      logger.error('Create comment error:', error);
      throw error;
    }
  }

  /**
   * Get comments for a post
   */
  static async getComments(
    postId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<any[]> {
    try {
      if (limit > 100) limit = 100;
      if (offset < 0) offset = 0;

      return await CommentModel.findByPostId(postId, limit, offset);
    } catch (error: any) {
      logger.error('Get comments error:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   */
  static async deleteComment(commentId: string, userId: string): Promise<void> {
    try {
      const comment = await CommentModel.findById(commentId);
      if (!comment) {
        throw new Error('Comment not found');
      }

      if (comment.user_id !== userId) {
        throw new Error('Unauthorized to delete this comment');
      }

      await CommentModel.delete(commentId);
      await PostModel.decrementCommentCount(comment.post_id);

      logger.info(`Comment deleted: ${commentId}`);
    } catch (error: any) {
      logger.error('Delete comment error:', error);
      throw error;
    }
  }

  /**
   * Search posts
   */
  static async searchPosts(searchQuery: string, limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      if (!searchQuery || searchQuery.trim().length === 0) {
        throw new Error('Search query cannot be empty');
      }

      if (searchQuery.length > 100) {
        throw new Error('Search query exceeds maximum length');
      }

      if (limit > 100) limit = 100;
      if (offset < 0) offset = 0;

      return await PostModel.search(searchQuery, limit, offset);
    } catch (error: any) {
      logger.error('Search posts error:', error);
      throw error;
    }
  }
}

export default PostService;