import { FastifyRequest, FastifyReply } from 'fastify';
import { userRepository, getDb, users } from '@codecraft/db';

const PUBLIC_ROUTES = new Set([
  '/api/auth/status',
  '/api/auth/onboarding',
  '/api/auth/login',
  '/api/health',
  '/health',
  '/api/system/health',
]);

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      name: string;
      isSuperuser: boolean;
    };
    userId?: string;
  }
}

export async function authGuard(req: FastifyRequest, reply: FastifyReply) {
  const pathUrl = (req.url || '').split('?')[0] || '';

  // Allow public endpoints
  if (PUBLIC_ROUTES.has(pathUrl)) {
    return;
  }

  // 1. Check Bearer Authorization token
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (token) {
    const sessionData = await userRepository.getSession(token);
    if (sessionData) {
      req.user = sessionData.user;
      req.userId = sessionData.user.id;
      return;
    }
  }

  // 2. Check x-user-id header
  const headerUserId = req.headers['x-user-id'] as string;
  if (headerUserId) {
    const user = await userRepository.findById(headerUserId);
    if (user) {
      req.user = user;
      req.userId = user.id;
      return;
    }
  }

  // 3. Development / first-time fallback: if no users exist in database at all, allow setup
  const db = getDb();
  const firstUser = db.select().from(users).limit(1).get();

  if (!firstUser) {
    // System onboarding mode: allow request
    return;
  }

  // In local single-user mode (if single user exists and no token passed), associate request with default user
  const userCount = db.select().from(users).all().length;
  if (userCount === 1) {
    req.user = firstUser;
    req.userId = firstUser.id;
    return;
  }

  // 4. Reject unauthenticated access
  return reply.status(401).send({
    error: 'Unauthorized',
    message: 'Authentication required. Please log in or provide a valid session token.',
  });
}
