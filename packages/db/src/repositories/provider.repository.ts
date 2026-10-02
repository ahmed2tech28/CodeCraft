import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { getDb } from '../client.js';
import {
  providerConfigs,
  ProviderConfigSelect,
  ProviderConfigInsert,
} from '../schema/provider-configs.js';

import { encryptSecret, decryptSecret } from '../crypto-utils.js';

export const providerRepository = {
  async getActiveConfig(): Promise<ProviderConfigSelect | null> {
    const db = getDb();
    const result = db
      .select()
      .from(providerConfigs)
      .where(eq(providerConfigs.isActive, true))
      .limit(1)
      .get();
    if (!result) return null;

    if (result.provider === 'gemini' && (!result.model || (result.model !== 'gemini-3.5-flash' && result.model !== 'gemini-2.5-flash'))) {
      result.model = 'gemini-3.5-flash';
    }

    if (result.apiKeyEncrypted) {
      result.apiKeyEncrypted = decryptSecret(result.apiKeyEncrypted);
    }

    return result;
  },

  async saveConfig(input: {
    provider: 'openai' | 'anthropic' | 'openrouter' | 'ollama' | 'gemini';
    model: string;
    apiKey?: string;
    baseUrl?: string;
  }): Promise<ProviderConfigSelect> {
    const db = getDb();
    // Deactivate previous active configs
    db.update(providerConfigs).set({ isActive: false }).run();

    const id = randomUUID();
    const encryptedKey = input.apiKey ? encryptSecret(input.apiKey) : null;

    const newConfig: ProviderConfigInsert = {
      id,
      provider: input.provider,
      model: input.model,
      apiKeyEncrypted: encryptedKey,
      baseUrl: input.baseUrl || null,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    db.insert(providerConfigs).values(newConfig).run();
    const saved = db.select().from(providerConfigs).where(eq(providerConfigs.id, id)).get()!;
    if (saved.apiKeyEncrypted) {
      saved.apiKeyEncrypted = decryptSecret(saved.apiKeyEncrypted);
    }
    return saved;
  },

  async listConfigs(): Promise<ProviderConfigSelect[]> {
    const db = getDb();
    return db.select().from(providerConfigs).all();
  },
};
