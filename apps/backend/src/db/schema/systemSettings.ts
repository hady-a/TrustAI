import { pgTable, uuid, boolean, integer, timestamp } from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const systemSettings = pgTable('system_settings', {
    id: uuid('id').primaryKey().defaultRandom(),
    maintenanceMode: boolean('maintenance_mode').default(false).notNull(),
    sessionTimeout: integer('session_timeout').default(15).notNull(), // in minutes
    maxUploadSize: integer('max_upload_size').default(100).notNull(), // in MB
    analysisTimeout: integer('analysis_timeout').default(300).notNull(), // in seconds
    notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
    emailAlertsEnabled: boolean('email_alerts_enabled').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export type SystemSettings = InferSelectModel<typeof systemSettings>;
export type NewSystemSettings = InferInsertModel<typeof systemSettings>;
