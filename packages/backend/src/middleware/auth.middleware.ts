import { Request, Response, NextFunction } from 'express';
import AuthService from '../services/auth.service';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Verify JWT token from Authorization header
 */
export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header',
      });
    }

    const token = authHeader.slice(7); // Remove 'Bearer ' prefix
    const decoded = AuthService.verifyAccessToken(token);

    if (!decoded) {
      return res.status(401).json({
        error: 'Invalid or expired token',
      });
    }

    req.userId = decoded.sub;
    next();
  } catch (error) {
    logger.error('Token verification error:', error);
    res.status(401).json({
      error: 'Unauthorized',
    });
  }
}

/**
 * Optional token verification (doesn't fail if missing)
 */
export function optionalToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const decoded = AuthService.verifyAccessToken(token);

      if (decoded) {
        req.userId = decoded.sub;
      }
    }

    next();
  } catch (error) {
    logger.error('Optional token verification error:', error);
    next(); // Continue without user context
  }
}

export default verifyToken;