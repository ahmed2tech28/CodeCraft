import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { getDb } from '../client.js';
import { systemSettings } from '../schema/system-settings.js';

export const systemRepository = {
  async getSetting(key: string): Promise<string | null> {
    const db = getDb();
    const result = db
      .select({ value: systemSettings.value })
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .get();
    return result ? result.value : null;
  },

  async setSetting(key: string, value: string): Promise<void> {
    const db = getDb();
    const existing = db
      .select({ id: systemSettings.id })
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .get();

    const now = new Date().toISOString();

    if (existing) {
      db.update(systemSettings)
        .set({ value, updatedAt: now })
        .where(eq(systemSettings.key, key))
        .run();
    } else {
      db.insert(systemSettings)
        .values({
          id: randomUUID(),
          key,
          value,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
  },

  async isOnboardingCompleted(): Promise<boolean> {
    const value = await this.getSetting('onboarding_completed');
    return value === 'true';
  },

  async completeOnboarding(): Promise<void> {
    await this.setSetting('onboarding_completed', 'true');
  },
};
