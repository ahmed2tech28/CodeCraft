import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const providerConfigs = sqliteTable('provider_configs', {
  id: text('id').primaryKey(),
  provider: text('provider', { enum: ['openai', 'anthropic', 'openrouter', 'ollama'] }).notNull(),
  model: text('model').notNull(),
  apiKeyEncrypted: text('api_key_encrypted'),
  baseUrl: text('base_url'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type ProviderConfigSelect = typeof providerConfigs.$inferSelect;
export type ProviderConfigInsert = typeof providerConfigs.$inferInsert;
