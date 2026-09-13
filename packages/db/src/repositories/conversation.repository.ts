import { eq, asc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { getDb } from '../client.js';
import {
  conversations,
  messages,
  ConversationSelect,
  MessageSelect,
} from '../schema/conversations.js';

export const conversationRepository = {
  async getOrCreateDefaultConversation(projectId: string): Promise<ConversationSelect> {
    const db = getDb();
    const existing = db
      .select()
      .from(conversations)
      .where(eq(conversations.projectId, projectId))
      .limit(1)
      .get();

    if (existing) return existing;

    const id = randomUUID();
    db.insert(conversations)
      .values({
        id,
        projectId,
        title: 'Main Chat',
        createdAt: new Date().toISOString(),
      })
      .run();

    return db.select().from(conversations).where(eq(conversations.id, id)).get()!;
  },

  async addMessage(input: {
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    tokens?: number;
  }): Promise<MessageSelect> {
    const db = getDb();
    const id = randomUUID();

    db.insert(messages)
      .values({
        id,
        conversationId: input.conversationId,
        role: input.role,
        content: input.content,
        tokens: input.tokens,
        createdAt: new Date().toISOString(),
      })
      .run();

    return db.select().from(messages).where(eq(messages.id, id)).get()!;
  },

  async getMessages(conversationId: string): Promise<MessageSelect[]> {
    const db = getDb();
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.createdAt))
      .all();
  },
};
