import { pgTable, uuid, varchar, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { roleEnum } from './enums';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }), // Can be NULL for OAuth users
    name: varchar('name', { length: 255 }).notNull(),
    role: roleEnum('role').default('USER').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    welcomeEmailSent: boolean('welcome_email_sent').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
}));

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
