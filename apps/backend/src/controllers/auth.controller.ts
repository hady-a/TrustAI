import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { signupSchema, loginSchema } from '../validators/auth.validator';
import { db, safeQuery } from '../db';
import { users } from '../db/schema/users';
import { systemSettings } from '../db/schema/systemSettings';
import { eq } from 'drizzle-orm';
import { AppError } from '../lib/AppError';
import { EmailService } from '../lib/email.service';
import { OAuth2Client } from 'google-auth-library';
import { generateToken, verifyToken, getJWTSecret } from '../lib/jwt.utils';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export class AuthController {
  // ========================================================================
  // HELPER: CHECK MAINTENANCE MODE
  // ========================================================================
  
  private static async checkMaintenanceMode(userRole?: string) {
    try {
      const settings = await db
        .select()
        .from(systemSettings)
        .limit(1);

      const maintenanceMode = settings.length > 0 ? settings[0].maintenanceMode : false;

      // If maintenance mode is on and user is not admin, throw error
      if (maintenanceMode && userRole !== 'ADMIN') {
        throw new AppError(
          'System is currently in maintenance mode. Please try again later.',
          503,
          'MAINTENANCE_MODE'
        );
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      // If we can't check maintenance mode, allow the request (fail open)
      console.warn('[Auth] Warning: Could not check maintenance mode:', error instanceof Error ? error.message : String(error));
    }
  }

  // ========================================================================
  // SIGNUP HANDLER
  // ========================================================================
  
  static async signup(req: Request, res: Response) {
    const parsed = signupSchema.parse(req.body);
    let { email, password, name } = parsed;
    
    // Normalize email
    email = email.trim().toLowerCase();

    console.log('[Auth] Processing signup for:', email);

    try {
      // Check maintenance mode (non-admin users cannot signup during maintenance)
      await AuthController.checkMaintenanceMode('USER');

      // Check if user already exists
      const existingUser = await safeQuery(
        () => db
          .select()
          .from(users)
          .where(eq(users.email, email)),
        `signup-check-existing-${email}`
      );

      if (existingUser.length > 0) {
        throw new AppError(
          'This email is already registered with an account. Please log in or use a different email address.',
          400,
          'USER_EXISTS'
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const [newUser] = await safeQuery(
        () => db
          .insert(users)
          .values({
            email,
            password: hashedPassword,
            name,
          })
          .returning(),
        `signup-create-user-${email}`
      );

      // Generate JWT
      const token = generateToken(
        { id: newUser.id, email: newUser.email, role: newUser.role }
      );

      console.log('[Auth] Signup successful for:', email);

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            role: newUser.role,
            createdAt: newUser.createdAt,
          },
          token,
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ETIMEDOUT')) {
        throw new AppError(
          'Database connection error. Please try again in a moment.',
          503,
          'DATABASE_UNAVAILABLE'
        );
      }
      
      throw error;
    }
  }

  // ========================================================================
  // LOGIN HANDLER - PRODUCTION GRADE
  // ========================================================================
  
  static async login(req: Request, res: Response) {
    const parsed = loginSchema.parse(req.body);
    let { email, password } = parsed;
    
    // Normalize email
    email = email.trim().toLowerCase();

    console.log('[Auth] Processing login for:', email);

    try {
      // Query user with safe wrapper
      const [user] = await safeQuery(
        () => db
          .select()
          .from(users)
          .where(eq(users.email, email)),
        `login-find-user-${email}`
      );

      if (!user) {
        console.log('[Auth] ❌ User not found:', email);
        throw new AppError(
          'No account found with this email address. Please check your email or create a new account.',
          401,
          'USER_NOT_FOUND'
        );
      }

      // Check maintenance mode - pass user role so admins can still login
      await AuthController.checkMaintenanceMode(user.role);

      console.log('[Auth] ✅ User found:', email);

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password || '');
      
      if (!isValidPassword) {
        console.log('[Auth] ❌ Invalid password for user:', email);
        throw new AppError(
          'The password you entered is incorrect. Please try again or use the forgot password option.',
          401,
          'INVALID_PASSWORD'
        );
      }

      console.log('[Auth] ✅ Password is correct for user:', email);

      // Generate JWT
      const token = generateToken(
        { id: user.id, email: user.email, role: user.role }
      );

      console.log('[Auth] ✅ Login successful for user:', email);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
          },
          token,
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ETIMEDOUT')) {
        console.error('[Auth] Database connection error during login');
        throw new AppError(
          'Database connection error. Please try again in a moment.',
          503,
          'DATABASE_UNAVAILABLE'
        );
      }
      
      throw error;
    }
  }

  // ========================================================================
  // CHECK EMAIL ENDPOINT
  // ========================================================================

  static async checkEmail(req: Request, res: Response) {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400, 'MISSING_EMAIL');
    }

    try {
      const existingUser = await safeQuery(
        () => db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase())),
        `check-email-${email}`
      );

      return res.status(200).json({
        success: true,
        exists: existingUser.length > 0,
        message: existingUser.length > 0 ? 'Email found' : 'Email not found',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ETIMEDOUT')) {
        throw new AppError(
          'Database connection error. Please try again in a moment.',
          503,
          'DATABASE_UNAVAILABLE'
        );
      }
      
      throw new AppError('Failed to check email', 500, 'CHECK_EMAIL_ERROR');
    }
  }

  // ========================================================================
  // RESET PASSWORD ENDPOINT  
  // ========================================================================

  static async resetPassword(req: Request, res: Response) {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      throw new AppError('Email and new password are required', 400, 'MISSING_FIELDS');
    }

    if (newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400, 'INVALID_PASSWORD');
    }

    console.log('[Auth] Password reset request for:', email);

    try {
      // Find user
      const existingUsers = await safeQuery(
        () => db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase())),
        `reset-password-find-user-${email}`
      );

      if (existingUsers.length === 0) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      await safeQuery(
        () => db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, existingUsers[0].id)),
        `reset-password-update-${email}`
      );

      console.log('[Auth] Password reset successful for:', email);

      return res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ETIMEDOUT')) {
        throw new AppError(
          'Database connection error. Please try again in a moment.',
          503,
          'DATABASE_UNAVAILABLE'
        );
      }
      
      throw error;
    }
  }

  // ========================================================================
  // CHANGE PASSWORD ENDPOINT - For authenticated users (OAuth & regular)
  // ========================================================================

  static async changePassword(req: Request, res: Response) {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401, 'NOT_AUTHENTICATED');
    }

    if (!newPassword) {
      throw new AppError('New password is required', 400, 'MISSING_NEW_PASSWORD');
    }

    if (newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400, 'INVALID_PASSWORD');
    }

    console.log('[Auth] Change password request for user:', userId);

    try {
      // Find user
      const existingUsers = await safeQuery(
        () => db
          .select()
          .from(users)
          .where(eq(users.id, userId)),
        `change-password-find-user-${userId}`
      );

      if (existingUsers.length === 0) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const user = existingUsers[0];

      // If user has a password, verify current password
      if (user.password) {
        if (!currentPassword) {
          throw new AppError('Current password is required to change password', 400, 'MISSING_CURRENT_PASSWORD');
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
          throw new AppError('Current password is incorrect', 401, 'INVALID_CURRENT_PASSWORD');
        }
      } else {
        // OAuth user setting password for the first time
        console.log('[Auth] OAuth user setting password for first time:', user.email);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user password
      await safeQuery(
        () => db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, userId)),
        `change-password-update-${userId}`
      );

      console.log('[Auth] Password changed successfully for user:', userId);

      return res.status(200).json({
        success: true,
        message: user.password ? 'Password changed successfully' : 'Password set successfully',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ETIMEDOUT')) {
        throw new AppError(
          'Database connection error. Please try again in a moment.',
          503,
          'DATABASE_UNAVAILABLE'
        );
      }
      
      throw error;
    }
  }

  // ========================================================================

  static async sendWelcomeEmail(req: Request, res: Response) {
    const { email, name } = req.body;

    if (!email || !name) {
      throw new AppError('Email and name are required', 400, 'MISSING_FIELDS');
    }

    try {
      // Check if user exists
      const [user] = await safeQuery(
        () => db
          .select()
          .from(users)
          .where(eq(users.email, email)),
        `welcome-email-check-${email}`
      );

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      // Skip if email already sent
      if (user.welcomeEmailSent) {
        console.log(`[Auth] Welcome email already sent to ${email}, skipping`);
        return res.status(200).json({
          success: true,
          message: 'Welcome email already sent to this user',
        });
      }

      // Send the welcome email
      const result = await EmailService.sendWelcomeEmail(email, name);

      // Mark as sent in database
      if (result.success) {
        await safeQuery(
          () => db
            .update(users)
            .set({ welcomeEmailSent: true })
            .where(eq(users.email, email)),
          `welcome-email-mark-sent-${email}`
        );
        console.log(`[Auth] Marked welcome email as sent for ${email}`);
      }

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error, email is optional
      return res.status(200).json({
        success: true,
        message: 'Welcome email sent (or will be sent)',
      });
    }
  }

  // ========================================================================
  // GOOGLE LOGIN
  // ========================================================================

  static async googleLogin(req: Request, res: Response) {
    const { credential } = req.body;

    console.log('[Google OAuth] ========== Google Login Started ==========');
    console.log('[Google OAuth] Received login request');
    console.log('[Google OAuth] Credential present:', !!credential);
    console.log('[Google OAuth] Credential length:', credential?.length || 0);

    if (!credential) {
      console.error('[Google OAuth] ❌ Missing credential');
      throw new AppError('Google credential token is required', 400, 'MISSING_CREDENTIAL');
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('[Google OAuth] ❌ GOOGLE_CLIENT_ID not configured');
      throw new AppError('Google OAuth is not properly configured on server', 500, 'OAUTH_CONFIG_ERROR');
    }

    try {
      console.log('[Google OAuth] ✅ Credential and CLIENT_ID verified');
      console.log('[Google OAuth] CLIENT_ID:', process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...');
      console.log('[Google OAuth] Verifying token with Google...');
      
      // Verify the token with Google
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      console.log('[Google OAuth] ✅ Google token verified successfully');

      const payload = ticket.getPayload();
      if (!payload) {
        console.error('[Google OAuth] ❌ Failed to extract payload from Google token');
        throw new AppError('Failed to extract payload from Google token', 400, 'INVALID_TOKEN');
      }

      const { email, name } = payload;
      
      if (!email) {
        console.error('[Google OAuth] ❌ Email not found in Google token');
        throw new AppError('Email not found in Google token', 400, 'MISSING_EMAIL');
      }

      console.log('[Google OAuth] ✅ Email extracted from token:', email);

      // Check if user exists
      console.log('[Google OAuth] Checking if user exists in database...');
      const existingUsers = await safeQuery(
        () => db
          .select()
          .from(users)
          .where(eq(users.email, email)),
        `google-login-find-user-${email}`
      );

      let user;

      if (existingUsers.length === 0) {
        // Create new user from Google OAuth
        console.log('[Google OAuth] ℹ️  User does not exist, creating new user:', email);
        
        const [newUser] = await safeQuery(
          () => db
            .insert(users)
            .values({
              email,
              name: name || email.split('@')[0],
              password: null as any,
              role: 'USER',
            })
            .returning(),
          `google-login-create-user-${email}`
        );
        
        if (!newUser) {
          console.error('[Google OAuth] ❌ Failed to create user, returned undefined');
          throw new AppError('Failed to create user account', 500, 'USER_CREATION_FAILED');
        }
        
        user = newUser;
        console.log('[Google OAuth] ✅ User created successfully:', { id: user.id, email: user.email });
      } else {
        console.log('[Google OAuth] ✅ User already exists:', email);
        user = existingUsers[0];
      }

      // Check maintenance mode - pass user role so admins can still login
      await AuthController.checkMaintenanceMode(user.role);

      // Generate JWT token
      console.log('[Google OAuth] Generating JWT token...');
      const token = generateToken(
        { id: user.id, email: user.email, role: user.role }
      );

      console.log('[Google OAuth] ✅ JWT token generated');
      console.log('[Google OAuth] ========== Google Login Successful ==========');

      return res.status(200).json({
        success: true,
        message: 'Google login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
          },
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('[Google OAuth] ========== Google Login FAILED ==========');
      console.error('[Google OAuth] Error Type:', error?.constructor?.name);
      console.error('[Google OAuth] Error Message:', errorMsg);
      console.error('[Google OAuth] Full Error:', error);
      
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ETIMEDOUT')) {
        throw new AppError(
          'Database connection error. Please try again in a moment.',
          503,
          'DATABASE_UNAVAILABLE'
        );
      }
      
      throw new AppError('Google login failed: ' + errorMsg, 401, 'GOOGLE_AUTH_ERROR');
    }
  }

  // ========================================================================
  // OAUTH REDIRECT & CALLBACK
  // ========================================================================

  static async oauthRedirect(req: Request, res: Response) {
    const { provider } = req.params;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const oauthUrls: Record<string, string> = {
      google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${frontendUrl}/auth/google/callback&response_type=code&scope=openid%20email%20profile`,
    };

    const url = oauthUrls[provider.toLowerCase()];
    if (!url) {
      throw new AppError('Invalid OAuth provider', 400, 'INVALID_PROVIDER');
    }

    return res.redirect(url);
  }

  static async oauthCallback(req: Request, res: Response) {
    const { email, name, provider } = req.body;

    if (!email || !provider) {
      throw new AppError('Email and provider are required', 400, 'MISSING_FIELDS');
    }

    try {
      const existingUser = await safeQuery(
        () => db
          .select()
          .from(users)
          .where(eq(users.email, email)),
        `oauth-callback-find-user-${email}`
      );

      let user;

      if (existingUser.length === 0) {
        const [newUser] = await safeQuery(
          () => db
            .insert(users)
            .values({
              email,
              name: name || email.split('@')[0],
              password: '',
              role: 'USER',
            })
            .returning(),
          `oauth-callback-create-user-${email}`
        );
        user = newUser;
      } else {
        user = existingUser[0];
      }

      const token = generateToken(
        { id: user.id, email: user.email, role: user.role }
      );

      return res.status(200).json({
        success: true,
        message: 'OAuth login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ETIMEDOUT')) {
        throw new AppError(
          'Database connection error. Please try again in a moment.',
          503,
          'DATABASE_UNAVAILABLE'
        );
      }
      
      throw new AppError('OAuth login failed', 500, 'OAUTH_ERROR');
    }
  }

  // ========================================================================
  // FORGOT PASSWORD
  // ========================================================================

  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400, 'MISSING_EMAIL');
    }

    try {
      const existingUser = await safeQuery(
        () => db
          .select()
          .from(users)
          .where(eq(users.email, email)),
        `forgot-password-find-user-${email}`
      );

      if (existingUser.length === 0) {
        // Don't reveal if email exists - security best practice
        return res.status(200).json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent',
        });
      }

      // Generate a password reset token (valid for 1 hour)
      const resetToken = jwt.sign(
        { id: existingUser[0].id, email: existingUser[0].email, type: 'reset' },
        getJWTSecret(),
        { expiresIn: '1h' }
      );

      console.log(`[Auth] Password reset token generated for: ${email}`);

      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent',
        data: { token: resetToken }, // For development only - remove in production
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ETIMEDOUT')) {
        throw new AppError(
          'Database connection error. Please try again in a moment.',
          503,
          'DATABASE_UNAVAILABLE'
        );
      }
      
      throw new AppError('Password reset request failed', 500, 'RESET_ERROR');
    }
  }
}

