import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import UserModel, { User } from '../models/user.model';
import RefreshTokenModel from '../models/refresh-token.model';
import logger from '../utils/logger';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  tokens: TokenPair;
}

export class AuthService {
  private static jwtSecret = process.env.JWT_SECRET || 'aurora_jwt_secret_dev';
  private static jwtExpiry = parseInt(process.env.JWT_EXPIRY || '3600'); // 1 hour
  private static refreshExpiry = parseInt(process.env.JWT_REFRESH_EXPIRY || '604800'); // 7 days
  private static bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');

  /**
   * Hash password with bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.bcryptRounds);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  static generateAccessToken(userId: string): string {
    return jwt.sign({ sub: userId }, this.jwtSecret, {
      expiresIn: this.jwtExpiry,
      algorithm: 'HS256',
    });
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(): string {
    return jwt.sign({ jti: uuidv4() }, this.jwtSecret, {
      expiresIn: this.refreshExpiry,
      algorithm: 'HS256',
    });
  }

  /**
   * Verify JWT token
   */
  static verifyAccessToken(token: string): { sub: string } | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as { sub: string };
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Register new user
   */
  static async register(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    // Validate input
    if (!data.username || !data.email || !data.password) {
      throw new Error('Missing required fields');
    }

    if (data.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Check if user exists
    const existingEmail = await UserModel.findByEmail(data.email);
    if (existingEmail) {
      throw new Error('Email already registered');
    }

    const existingUsername = await UserModel.findByUsername(data.username);
    if (existingUsername) {
      throw new Error('Username already taken');
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const user = await UserModel.create({
      username: data.username,
      email: data.email.toLowerCase(),
      password_hash: passwordHash,
    });

    logger.info(`User registered: ${user.id}`);

    // Generate tokens
    const tokens = await this.generateTokenPair(user.id);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Login with email and password
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await this.comparePassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    logger.info(`User logged in: ${user.id}`);

    // Generate tokens
    const tokens = await this.generateTokenPair(user.id);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  static async refresh(refreshToken: string): Promise<TokenPair> {
    // Verify refresh token exists in DB
    const tokenRecord = await RefreshTokenModel.findByToken(refreshToken);
    if (!tokenRecord) {
      throw new Error('Invalid or revoked refresh token');
    }

    // Check if expired
    if (new Date() > tokenRecord.expires_at) {
      await RefreshTokenModel.revoke(refreshToken);
      throw new Error('Refresh token expired');
    }

    // Generate new tokens
    const tokens = await this.generateTokenPair(tokenRecord.user_id);

    logger.info(`Token refreshed for user: ${tokenRecord.user_id}`);

    return tokens;
  }

  /**
   * Logout (revoke refresh tokens)
   */
  static async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await RefreshTokenModel.revoke(refreshToken);
    } else {
      // Revoke all tokens for user
      await RefreshTokenModel.revokeAll(userId);
    }

    logger.info(`User logged out: ${userId}`);
  }

  /**
   * OAuth login/registration
   */
  static async oauthLogin(provider: string, profileId: string, profile: any): Promise<AuthResponse> {
    // Check if user exists
    let user = await UserModel.findByProvider(provider, profileId);

    if (!user) {
      // Create new user from OAuth profile
      user = await UserModel.create({
        username: profile.username || profile.email.split('@')[0],
        email: profile.email,
        password_hash: '', // OAuth users don't have password
        provider,
        provider_id: profileId,
      });

      logger.info(`New OAuth user registered: ${user.id} (${provider})`);
    } else {
      logger.info(`OAuth user logged in: ${user.id} (${provider})`);
    }

    // Generate tokens
    const tokens = await this.generateTokenPair(user.id);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  /**
   * Generate access and refresh token pair
   */
  private static async generateTokenPair(userId: string): Promise<TokenPair> {
    const accessToken = this.generateAccessToken(userId);
    const refreshTokenString = this.generateRefreshToken();
    const expiresAt = new Date(Date.now() + this.refreshExpiry * 1000);

    await RefreshTokenModel.create(userId, refreshTokenString, expiresAt);

    return {
      accessToken,
      refreshToken: refreshTokenString,
    };
  }

  /**
   * Sanitize user object (remove sensitive fields)
   */
  private static sanitizeUser(user: User): Omit<User, 'password_hash'> {
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }
}

export default AuthService;