import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema/users';
import { eq } from 'drizzle-orm';
import { AppError } from '../lib/AppError';
import bcrypt from 'bcrypt';

export class UserController {
  // Get all users
  static async getAllUsers(req: Request, res: Response) {
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users);

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: allUsers,
    });
  }

  // Get user by ID
  static async getUserById(req: Request, res: Response) {
    const { id } = req.params;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id));

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user,
    });
  }

  // Create a new user
  static async createUser(req: Request, res: Response) {
    const { email, password, name, role } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      throw new AppError('Email, password, and name are required', 400, 'MISSING_FIELDS');
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (existingUser.length > 0) {
      throw new AppError('This email is already registered', 400, 'USER_EXISTS');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        password: hashedPassword,
        name,
        role: role || 'USER',
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    });
  }

  // Update user (role, status, name)
  static async updateUser(req: Request, res: Response) {
    const { id } = req.params;
    const { name, role, isActive } = req.body;

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    });
  }

  // Delete user
  static async deleteUser(req: Request, res: Response) {
    const { id } = req.params;

    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Prevent deleting the requesting admin
    if (id === req.user?.id) {
      throw new AppError('You cannot delete your own account', 400, 'CANNOT_DELETE_SELF');
    }

    // Delete user
    await db
      .delete(users)
      .where(eq(users.id, id));

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  }
}
