import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import AuthService from '../services/auth.service';
import UserModel from '../models/user.model';
import logger from '../utils/logger';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  /**
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response) {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }

      // Register user
      const result = await AuthService.register({
        username,
        email,
        password,
      });

      res.status(201).json(result);
    } catch (error: any) {
      logger.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      // Login user
      const result = await AuthService.login(email, password);

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json(result);
    } catch (error: any) {
      logger.error('Login error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  /**
   * POST /api/auth/refresh
   */
  static async refresh(req: AuthRequest, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Missing refresh token' });
      }

      const tokens = await AuthService.refresh(refreshToken);

      // Update cookie with new refresh token
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json(tokens);
    } catch (error: any) {
      logger.error('Refresh error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  /**
   * POST /api/auth/logout
   */
  static async logout(req: AuthRequest, res: Response) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (req.userId) {
        await AuthService.logout(req.userId, refreshToken);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.json({ message: 'Logged out successfully' });
    } catch (error: any) {
      logger.error('Logout error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/auth/me
   */
  static async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await UserModel.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { password_hash, ...sanitized } = user;
      res.json(sanitized);
    } catch (error: any) {
      logger.error('Get current user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/auth/verify-email
   */
  static async verifyEmail(req: Request, res: Response) {
    try {
      const { token } = req.body;

      // TODO: Implement email verification with tokens
      // This is a placeholder for the actual implementation

      res.json({ message: 'Email verified successfully' });
    } catch (error: any) {
      logger.error('Email verification error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/auth/forgot-password
   */
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Don't reveal if user exists
        return res.json({ message: 'If email exists, password reset link has been sent' });
      }

      // TODO: Generate password reset token and send email

      res.json({ message: 'Password reset link has been sent to your email' });
    } catch (error: any) {
      logger.error('Forgot password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/auth/reset-password
   */
  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, password, confirmPassword } = req.body;

      if (!token || !password || !confirmPassword) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
      }

      // TODO: Verify token and reset password

      res.json({ message: 'Password reset successfully' });
    } catch (error: any) {
      logger.error('Reset password error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

export default AuthController;