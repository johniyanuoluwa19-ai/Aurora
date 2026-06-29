import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  replies_count: number;
  parent_comment_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CommentWithAuthor extends Comment {
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  liked_by_user?: boolean;
}

export class CommentModel {
  static async create(data: {
    post_id: string;
    user_id: string;
    content: string;
    parent_comment_id?: string;
  }): Promise<Comment> {
    const id = uuidv4();
    const now = new Date();

    const result = await query(
      `INSERT INTO comments (id, post_id, user_id, content, parent_comment_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, data.post_id, data.user_id, data.content, data.parent_comment_id || null, now, now]
    );

    return result.rows[0];
  }

  static async findById(id: string): Promise<CommentWithAuthor | null> {
    const result = await query(
      `SELECT 
        c.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'avatar_url', u.avatar_url,
          'is_verified', u.is_verified
        ) as author
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  static async findByPostId(postId: string, limit: number = 20, offset: number = 0): Promise<CommentWithAuthor[]> {
    const result = await query(
      `SELECT 
        c.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'avatar_url', u.avatar_url,
          'is_verified', u.is_verified
        ) as author
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1 AND c.parent_comment_id IS NULL
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [postId, limit, offset]
    );

    return result.rows;
  }

  static async findReplies(parentCommentId: string, limit: number = 10): Promise<CommentWithAuthor[]> {
    const result = await query(
      `SELECT 
        c.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'avatar_url', u.avatar_url,
          'is_verified', u.is_verified
        ) as author
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.parent_comment_id = $1
       ORDER BY c.created_at ASC
       LIMIT $2`,
      [parentCommentId, limit]
    );

    return result.rows;
  }

  static async update(id: string, content: string): Promise<Comment> {
    const result = await query(
      'UPDATE comments SET content = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [content, id]
    );

    return result.rows[0];
  }

  static async delete(id: string): Promise<void> {
    await query('DELETE FROM comments WHERE id = $1', [id]);
  }

  static async countByPost(postId: string): Promise<number> {
    const result = await query('SELECT COUNT(*) as count FROM comments WHERE post_id = $1', [postId]);
    return parseInt(result.rows[0].count);
  }
}

export default CommentModel;