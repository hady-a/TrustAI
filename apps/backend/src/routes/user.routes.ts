import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireAdmin } from '../middleware/admin.middleware';

const router = Router();

// All user routes require authentication
// Get all users (admin only)
router.get('/', requireAuth, requireAdmin, UserController.getAllUsers);

// Get user by ID (admin only)
router.get('/:id', requireAuth, requireAdmin, UserController.getUserById);

// Create a new user (admin only)
router.post('/', requireAuth, requireAdmin, UserController.createUser);

// Update user (admin only)
router.put('/:id', requireAuth, requireAdmin, UserController.updateUser);

// Delete user (admin only)
router.delete('/:id', requireAuth, requireAdmin, UserController.deleteUser);

export default router;
