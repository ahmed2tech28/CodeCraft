import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { projects } from './projects.js';

export const agentRuns = sqliteTable('agent_runs', {
  id: text('id').primaryKey(),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  prompt: text('prompt').notNull(),
  status: text('status', {
    enum: [
      'queued',
      'planning',
      'coding',
      'installing',
      'building',
      'debugging',
      'testing',
      'completed',
      'failed',
      'cancelled',
    ],
  })
    .notNull()
    .default('queued'),
  durationMs: integer('duration_ms'),
  tokensUsed: integer('tokens_used'),
  error: text('error'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const agentToolCalls = sqliteTable('agent_tool_calls', {
  id: text('id').primaryKey(),
  agentRunId: text('agent_run_id').notNull().references(() => agentRuns.id, { onDelete: 'cascade' }),
  toolName: text('tool_name').notNull(),
  input: text('input').notNull(), // JSON serialized
  output: text('output'), // JSON or text serialized
  status: text('status', { enum: ['pending', 'success', 'error'] }).notNull().default('pending'),
  durationMs: integer('duration_ms'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export type AgentRunSelect = typeof agentRuns.$inferSelect;
export type AgentRunInsert = typeof agentRuns.$inferInsert;
export type AgentToolCallSelect = typeof agentToolCalls.$inferSelect;
export type AgentToolCallInsert = typeof agentToolCalls.$inferInsert;
