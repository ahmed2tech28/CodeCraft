import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { getDb } from '../client.js';
import { users, sessions, UserInsert } from '../schema/users.js';

export const userRepository = {
  async hasSuperUser(): Promise<boolean> {
    const db = getDb();
    const result = db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.isSuperuser, true))
      .limit(1)
      .get();
    return !!result;
  },

  async createSuperUser(input: {
    name: string;
    email: string;
    password: string;
  }) {
    const db = getDb();
    const passwordHash = await bcrypt.hash(input.password, 10);
    const userId = randomUUID();

    const newUser: UserInsert = {
      id: userId,
      email: input.email.toLowerCase().trim(),
      name: input.name.trim(),
      passwordHash,
      isSuperuser: true,
      createdAt: new Date().toISOString(),
    };

    db.insert(users).values(newUser).run();

    return {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      isSuperuser: true,
      createdAt: newUser.createdAt,
    };
  },

  async findByEmail(email: string) {
    const db = getDb();
    return db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .get();
  },

  async findById(id: string) {
    const db = getDb();
    const user = db.select().from(users).where(eq(users.id, id)).get();
    if (!user) return null;
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  },

  async verifyPassword(user: { passwordHash: string }, plainTextPassword: string): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, user.passwordHash);
  },

  async createSession(userId: string, expiresInDays = 7) {
    const db = getDb();
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    db.insert(sessions)
      .values({
        id: randomUUID(),
        userId,
        token,
        expiresAt,
        createdAt: new Date().toISOString(),
      })
      .run();

    return { token, expiresAt };
  },

  async getSession(token: string) {
    const db = getDb();
    const session = db.select().from(sessions).where(eq(sessions.token, token)).get();
    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
      db.delete(sessions).where(eq(sessions.token, token)).run();
      return null;
    }

    const user = await this.findById(session.userId);
    if (!user) return null;

    return { session, user };
  },

  async deleteSession(token: string) {
    const db = getDb();
    db.delete(sessions).where(eq(sessions.token, token)).run();
  },
};
