import { FastifyInstance } from 'fastify';
import { userRepository, systemRepository, providerRepository } from '@codecraft/db';
import { createSuperUserSchema, loginSchema } from '@codecraft/shared';

export async function authRoutes(server: FastifyInstance) {
  // Check onboarding & superuser status
  server.get('/api/auth/status', async () => {
    const hasSuperuser = await userRepository.hasSuperUser();
    const isInitialized = await systemRepository.isOnboardingCompleted();
    const activeProvider = await providerRepository.getActiveConfig();

    return {
      hasSuperuser,
      isInitialized,
      defaultProviderConfigured: !!activeProvider || !!process.env.OPENAI_API_KEY || !!process.env.ANTHROPIC_API_KEY || !!process.env.GEMINI_API_KEY || !!process.env.OPENROUTER_API_KEY,
    };
  });

  // First-time superuser onboarding creation
  server.post('/api/auth/onboarding', async (req, reply) => {
    const hasSuper = await userRepository.hasSuperUser();
    if (hasSuper) {
      return reply.status(400).send({ error: 'Superuser already exists. Onboarding already completed.' });
    }

    const body = createSuperUserSchema.parse(req.body);

    const superUser = await userRepository.createSuperUser({
      name: body.name,
      email: body.email,
      password: body.password,
    });

    // Save initial AI provider configuration
    await providerRepository.saveConfig({
      provider: body.aiProvider,
      model: body.aiModel,
      apiKey: body.apiKey,
      baseUrl: body.baseUrl,
    });

    // Mark system onboarding as completed
    await systemRepository.completeOnboarding();

    // Create active session
    const session = await userRepository.createSession(superUser.id);

    return {
      success: true,
      user: superUser,
      session,
    };
  });

  // User Login
  server.post('/api/auth/login', async (req, reply) => {
    const body = loginSchema.parse(req.body);
    const user = await userRepository.findByEmail(body.email);

    if (!user) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const isValid = await userRepository.verifyPassword(user, body.password);
    if (!isValid) {
      return reply.status(401).send({ error: 'Invalid email or password' });
    }

    const session = await userRepository.createSession(user.id);
    const { passwordHash: _, ...safeUser } = user;

    return {
      success: true,
      user: safeUser,
      session,
    };
  });

  // Get current user profile
  server.get('/api/auth/me', async (req, reply) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    const sessionData = await userRepository.getSession(token);
    if (!sessionData) {
      return reply.status(401).send({ error: 'Session expired or invalid' });
    }

    return {
      user: sessionData.user,
      session: sessionData.session,
    };
  });
}
