import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimiter.middleware';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/signup', authLimiter, AuthController.signup);
router.post('/login', authLimiter, AuthController.login);
router.post('/google-login', authLimiter, AuthController.googleLogin);
router.post('/check-email', AuthController.checkEmail);
router.post('/reset-password', authLimiter, AuthController.resetPassword);
router.post('/change-password', authLimiter, requireAuth, AuthController.changePassword);
router.post('/send-welcome-email', AuthController.sendWelcomeEmail);
router.post('/oauth/callback', AuthController.oauthCallback);
router.get('/oauth/:provider', AuthController.oauthRedirect);
router.post('/forgot-password', authLimiter, AuthController.forgotPassword);

export default router;
