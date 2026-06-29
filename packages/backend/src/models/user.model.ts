import { query } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  avatar_url: string | null;
  bio: string | null;
  is_verified: boolean;
  is_creator: boolean;
  provider: 'local' | 'google' | 'apple';
  provider_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export class UserModel {
  static async create(data: {
    username: string;
    email: string;
    password_hash: string;
    provider?: string;
    provider_id?: string;
  }): Promise<User> {
    const id = uuidv4();
    const provider = data.provider || 'local';
    const now = new Date();

    const result = await query(
      `INSERT INTO users (id, username, email, password_hash, provider, provider_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, data.username, data.email, data.password_hash, provider, data.provider_id || null, now, now]
    );

    return result.rows[0];
  }

  static async findById(id: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const result = await query('SELECT * FROM users WHERE username = $1 LIMIT 1', [username]);
    return result.rows[0] || null;
  }

  static async findByProvider(provider: string, providerId: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE provider = $1 AND provider_id = $2 LIMIT 1',
      [provider, providerId]
    );
    return result.rows[0] || null;
  }

  static async update(id: string, data: Partial<User>): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [id];
    let paramCount = 2;

    const fields = ['username', 'email', 'avatar_url', 'bio', 'is_verified', 'is_creator'];

    for (const field of fields) {
      if (field in data) {
        updates.push(`${field} = $${paramCount}`);
        values.push(data[field as keyof User]);
        paramCount++;
      }
    }

    if (updates.length === 0) {
      return this.findById(id) as Promise<User>;
    }

    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );

    return result.rows[0];
  }

  static async delete(id: string): Promise<void> {
    await query('DELETE FROM users WHERE id = $1', [id]);
  }

  static async list(limit: number = 50, offset: number = 0): Promise<User[]> {
    const result = await query(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }
}

export default UserModel;