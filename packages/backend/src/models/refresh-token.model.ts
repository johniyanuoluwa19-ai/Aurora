import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface RefreshToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  revoked: boolean;
}

export class RefreshTokenModel {
  static async create(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
    const id = uuidv4();
    const now = new Date();

    const result = await query(
      `INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at, revoked)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, userId, token, expiresAt, now, false]
    );

    return result.rows[0];
  }

  static async findByToken(token: string): Promise<RefreshToken | null> {
    const result = await query(
      'SELECT * FROM refresh_tokens WHERE token = $1 AND revoked = false LIMIT 1',
      [token]
    );
    return result.rows[0] || null;
  }

  static async findByUserId(userId: string): Promise<RefreshToken[]> {
    const result = await query(
      'SELECT * FROM refresh_tokens WHERE user_id = $1 AND revoked = false',
      [userId]
    );
    return result.rows;
  }

  static async revoke(token: string): Promise<void> {
    await query('UPDATE refresh_tokens SET revoked = true WHERE token = $1', [token]);
  }

  static async revokeAll(userId: string): Promise<void> {
    await query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [userId]);
  }

  static async cleanup(): Promise<void> {
    // Delete expired tokens
    await query('DELETE FROM refresh_tokens WHERE expires_at < NOW()');
  }
}

export default RefreshTokenModel;