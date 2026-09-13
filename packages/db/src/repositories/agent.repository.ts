import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { getDb } from '../client.js';
import {
  agentRuns,
  agentToolCalls,
  AgentRunSelect,
  AgentToolCallSelect,
} from '../schema/agent-runs.js';

export const agentRepository = {
  async createRun(input: { projectId: string; prompt: string }): Promise<AgentRunSelect> {
    const db = getDb();
    const id = randomUUID();
    const now = new Date().toISOString();

    db.insert(agentRuns)
      .values({
        id,
        projectId: input.projectId,
        prompt: input.prompt,
        status: 'queued',
        createdAt: now,
      })
      .run();

    return db.select().from(agentRuns).where(eq(agentRuns.id, id)).get()!;
  },

  async updateRunStatus(
    id: string,
    status:
      | 'queued'
      | 'planning'
      | 'coding'
      | 'installing'
      | 'building'
      | 'debugging'
      | 'testing'
      | 'completed'
      | 'failed'
      | 'cancelled',
    extra?: { durationMs?: number; tokensUsed?: number; error?: string }
  ): Promise<void> {
    const db = getDb();
    db.update(agentRuns)
      .set({
        status,
        ...(extra?.durationMs !== undefined ? { durationMs: extra.durationMs } : {}),
        ...(extra?.tokensUsed !== undefined ? { tokensUsed: extra.tokensUsed } : {}),
        ...(extra?.error !== undefined ? { error: extra.error } : {}),
      })
      .where(eq(agentRuns.id, id))
      .run();
  },

  async recordToolCall(input: {
    agentRunId: string;
    toolName: string;
    input: Record<string, unknown>;
    output?: Record<string, unknown> | string | null;
    status: 'pending' | 'success' | 'error';
    durationMs?: number;
  }): Promise<AgentToolCallSelect> {
    const db = getDb();
    const id = randomUUID();

    db.insert(agentToolCalls)
      .values({
        id,
        agentRunId: input.agentRunId,
        toolName: input.toolName,
        input: JSON.stringify(input.input),
        output:
          typeof input.output === 'string'
            ? input.output
            : input.output
              ? JSON.stringify(input.output)
              : null,
        status: input.status,
        durationMs: input.durationMs,
        createdAt: new Date().toISOString(),
      })
      .run();

    return db.select().from(agentToolCalls).where(eq(agentToolCalls.id, id)).get()!;
  },

  async getRunsByProject(projectId: string): Promise<AgentRunSelect[]> {
    const db = getDb();
    return db
      .select()
      .from(agentRuns)
      .where(eq(agentRuns.projectId, projectId))
      .orderBy(desc(agentRuns.createdAt))
      .all();
  },

  async getToolCallsByRun(agentRunId: string): Promise<AgentToolCallSelect[]> {
    const db = getDb();
    return db
      .select()
      .from(agentToolCalls)
      .where(eq(agentToolCalls.agentRunId, agentRunId))
      .all();
  },
};
