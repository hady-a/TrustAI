import { z } from 'zod';

export const signupSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    name: z.string().min(1, 'Name is required'),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string().min(8, 'Password must be at least 8 characters long'),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
    }),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>['body'];
