import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { users } from './users.js';

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  path: text('path').notNull(),
  status: text('status', { enum: ['idle', 'building', 'running', 'error', 'stopped'] }).notNull().default('idle'),
  previewUrl: text('preview_url'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type ProjectSelect = typeof projects.$inferSelect;
export type ProjectInsert = typeof projects.$inferInsert;
