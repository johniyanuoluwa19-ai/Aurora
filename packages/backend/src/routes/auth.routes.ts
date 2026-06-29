import { Router } from 'express';
import AuthController from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { registerValidator, loginValidator } from '../validators/auth.validator';

const router = Router();

// Public routes
router.post('/register', registerValidator, AuthController.register);
router.post('/login', loginValidator, AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes
router.get('/me', verifyToken, AuthController.getCurrentUser);
router.post('/logout', verifyToken, AuthController.logout);
router.post('/verify-email', AuthController.verifyEmail);

export default router;