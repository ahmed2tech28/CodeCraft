import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { getDb } from '../client.js';
import {
  providerConfigs,
  ProviderConfigSelect,
  ProviderConfigInsert,
} from '../schema/provider-configs.js';

export const providerRepository = {
  async getActiveConfig(): Promise<ProviderConfigSelect | null> {
    const db = getDb();
    const result = db
      .select()
      .from(providerConfigs)
      .where(eq(providerConfigs.isActive, true))
      .limit(1)
      .get();
    return result || null;
  },

  async saveConfig(input: {
    provider: 'openai' | 'anthropic' | 'openrouter' | 'ollama';
    model: string;
    apiKey?: string;
    baseUrl?: string;
  }): Promise<ProviderConfigSelect> {
    const db = getDb();
    // Deactivate previous active configs
    db.update(providerConfigs).set({ isActive: false }).run();

    const id = randomUUID();
    const newConfig: ProviderConfigInsert = {
      id,
      provider: input.provider,
      model: input.model,
      apiKeyEncrypted: input.apiKey || null,
      baseUrl: input.baseUrl || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    db.insert(providerConfigs).values(newConfig).run();
    return db.select().from(providerConfigs).where(eq(providerConfigs.id, id)).get()!;
  },

  async listConfigs(): Promise<ProviderConfigSelect[]> {
    const db = getDb();
    return db.select().from(providerConfigs).all();
  },
};
