import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface Like {
  id: string;
  user_id: string;
  post_id: string;
  created_at: Date;
}

export class LikeModel {
  static async create(userId: string, postId: string): Promise<Like> {
    const id = uuidv4();
    const now = new Date();

    const result = await query(
      `INSERT INTO likes (id, user_id, post_id, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [id, userId, postId, now]
    );

    if (result.rows.length > 0) {
      // Update likes count
      await query('UPDATE posts SET likes_count = likes_count + 1, updated_at = NOW() WHERE id = $1', [postId]);
    }

    return result.rows[0];
  }

  static async delete(userId: string, postId: string): Promise<void> {
    const result = await query(
      'DELETE FROM likes WHERE user_id = $1 AND post_id = $2 RETURNING id',
      [userId, postId]
    );

    if (result.rows.length > 0) {
      // Update likes count
      await query('UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0), updated_at = NOW() WHERE id = $1', [
        postId,
      ]);
    }
  }

  static async findByPostAndUser(postId: string, userId: string): Promise<Like | null> {
    const result = await query('SELECT * FROM likes WHERE post_id = $1 AND user_id = $2 LIMIT 1', [postId, userId]);
    return result.rows[0] || null;
  }

  static async countByPost(postId: string): Promise<number> {
    const result = await query('SELECT COUNT(*) as count FROM likes WHERE post_id = $1', [postId]);
    return parseInt(result.rows[0].count);
  }

  static async listByPost(postId: string, limit: number = 10): Promise<any[]> {
    const result = await query(
      `SELECT u.id, u.username, u.avatar_url, u.is_verified, l.created_at
       FROM likes l
       JOIN users u ON l.user_id = u.id
       WHERE l.post_id = $1
       ORDER BY l.created_at DESC
       LIMIT $2`,
      [postId, limit]
    );
    return result.rows;
  }
}

export default LikeModel;