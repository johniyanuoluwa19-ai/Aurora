import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[] | null;
  media_types: string[] | null;
  visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_pinned: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PostWithAuthor extends Post {
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
  liked_by_user?: boolean;
}

export class PostModel {
  static async create(data: {
    user_id: string;
    content: string;
    media_urls?: string[];
    media_types?: string[];
    visibility?: string;
  }): Promise<Post> {
    const id = uuidv4();
    const visibility = data.visibility || 'PUBLIC';
    const now = new Date();

    const result = await query(
      `INSERT INTO posts (id, user_id, content, media_urls, media_types, visibility, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, data.user_id, data.content, data.media_urls || null, data.media_types || null, visibility, now, now]
    );

    return result.rows[0];
  }

  static async findById(id: string): Promise<PostWithAuthor | null> {
    const result = await query(
      `SELECT 
        p.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'avatar_url', u.avatar_url,
          'is_verified', u.is_verified
        ) as author
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  static async findByIdWithUser(id: string, userId?: string): Promise<PostWithAuthor | null> {
    const result = await query(
      `SELECT 
        p.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'avatar_url', u.avatar_url,
          'is_verified', u.is_verified
        ) as author,
        CASE WHEN $2::uuid IS NOT NULL AND EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $2) THEN true ELSE false END as liked_by_user
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1`,
      [id, userId || null]
    );

    return result.rows[0] || null;
  }

  static async findByUserId(userId: string, limit: number = 20, offset: number = 0): Promise<PostWithAuthor[]> {
    const result = await query(
      `SELECT 
        p.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'avatar_url', u.avatar_url,
          'is_verified', u.is_verified
        ) as author
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1 AND p.visibility = 'PUBLIC'
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  static async getFeed(userId: string, limit: number = 20, offset: number = 0): Promise<PostWithAuthor[]> {
    const result = await query(
      `SELECT 
        p.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'avatar_url', u.avatar_url,
          'is_verified', u.is_verified
        ) as author,
        CASE WHEN EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $1) THEN true ELSE false END as liked_by_user
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.visibility = 'PUBLIC' OR p.user_id = $1 OR p.user_id IN (
         SELECT following_id FROM follows WHERE follower_id = $1
       )
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  static async update(id: string, data: Partial<Post>): Promise<Post> {
    const updates: string[] = [];
    const values: any[] = [id];
    let paramCount = 2;

    const fields = ['content', 'media_urls', 'media_types', 'visibility', 'is_pinned'];

    for (const field of fields) {
      if (field in data) {
        updates.push(`${field} = $${paramCount}`);
        values.push(data[field as keyof Post]);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return this.findById(id) as Promise<any>;
    }

    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    const result = await query(
      `UPDATE posts SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id: string): Promise<void> {
    await query('DELETE FROM posts WHERE id = $1', [id]);
  }

  static async incrementCommentCount(postId: string): Promise<void> {
    await query(
      'UPDATE posts SET comments_count = comments_count + 1, updated_at = NOW() WHERE id = $1',
      [postId]
    );
  }

  static async decrementCommentCount(postId: string): Promise<void> {
    await query(
      'UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0), updated_at = NOW() WHERE id = $1',
      [postId]
    );
  }

  static async search(query_text: string, limit: number = 20, offset: number = 0): Promise<PostWithAuthor[]> {
    const result = await query(
      `SELECT 
        p.*,
        json_build_object(
          'id', u.id,
          'username', u.username,
          'avatar_url', u.avatar_url,
          'is_verified', u.is_verified
        ) as author
       FROM posts p
       JOIN users u ON p.user_id = u.id
       WHERE p.visibility = 'PUBLIC' AND p.content ILIKE $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [`%${query_text}%`, limit, offset]
    );

    return result.rows;
  }
}

export default PostModel;