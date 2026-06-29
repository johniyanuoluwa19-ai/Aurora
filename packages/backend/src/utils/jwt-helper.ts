import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'aurora_jwt_secret_dev';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRY || '3600'; // 1 hour
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '604800'; // 7 days

export function generateAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, {
    expiresIn: parseInt(ACCESS_TOKEN_EXPIRY),
    algorithm: 'HS256',
  });
}

export function generateRefreshToken(): string {
  return jwt.sign({ type: 'refresh' }, JWT_SECRET, {
    expiresIn: parseInt(REFRESH_TOKEN_EXPIRY),
    algorithm: 'HS256',
  });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
  } catch (error) {
    return null;
  }
}

export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

export default {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
};