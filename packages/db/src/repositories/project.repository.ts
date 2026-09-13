import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { getDb } from '../client.js';
import { projects, ProjectInsert, ProjectSelect } from '../schema/projects.js';

export const projectRepository = {
  async createProject(input: {
    userId: string;
    name: string;
    slug?: string;
    path: string;
  }): Promise<ProjectSelect> {
    const db = getDb();
    const id = randomUUID();
    const slug =
      input.slug ||
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + `-${id.slice(0, 6)}`;

    const now = new Date().toISOString();

    const newProject: ProjectInsert = {
      id,
      userId: input.userId,
      name: input.name,
      slug,
      path: input.path,
      status: 'idle',
      createdAt: now,
      updatedAt: now,
    };

    db.insert(projects).values(newProject).run();
    return db.select().from(projects).where(eq(projects.id, id)).get()!;
  },

  async listProjects(userId?: string): Promise<ProjectSelect[]> {
    const db = getDb();
    if (userId) {
      return db
        .select()
        .from(projects)
        .where(eq(projects.userId, userId))
        .orderBy(desc(projects.updatedAt))
        .all();
    }
    return db.select().from(projects).orderBy(desc(projects.updatedAt)).all();
  },

  async getProjectById(id: string): Promise<ProjectSelect | null> {
    const db = getDb();
    const result = db.select().from(projects).where(eq(projects.id, id)).get();
    return result || null;
  },

  async getProjectBySlug(slug: string): Promise<ProjectSelect | null> {
    const db = getDb();
    const result = db.select().from(projects).where(eq(projects.slug, slug)).get();
    return result || null;
  },

  async updateProjectStatus(
    id: string,
    status: 'idle' | 'building' | 'running' | 'error' | 'stopped',
    previewUrl?: string | null
  ): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    db.update(projects)
      .set({
        status,
        ...(previewUrl !== undefined ? { previewUrl } : {}),
        updatedAt: now,
      })
      .where(eq(projects.id, id))
      .run();
  },

  async deleteProject(id: string): Promise<void> {
    const db = getDb();
    db.delete(projects).where(eq(projects.id, id)).run();
  },
};
