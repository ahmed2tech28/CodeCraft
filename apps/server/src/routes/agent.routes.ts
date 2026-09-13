import { FastifyInstance } from 'fastify';
import { agentRunner } from '@codecraft/agent';
import { conversationRepository, agentRepository } from '@codecraft/db';
import { workspaceService } from '../services/workspace.service.js';
import { gitService } from '../services/git.service.js';
import { startAgentRunSchema } from '@codecraft/shared';

// Active SSE client listeners by project ID
const agentStreamSubscribers = new Map<string, Set<(event: string) => void>>();

export function broadcastAgentEvent(projectId: string, eventData: Record<string, unknown>) {
  const subscribers = agentStreamSubscribers.get(projectId);
  if (subscribers) {
    const sseMessage = `data: ${JSON.stringify(eventData)}\n\n`;
    for (const send of subscribers) {
      send(sseMessage);
    }
  }
}

export async function agentRoutes(server: FastifyInstance) {
  // SSE Streaming Endpoint for Real-Time Agent Events
  server.get('/api/projects/:id/agent/stream', (req, reply) => {
    const { id } = req.params as { id: string };

    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');

    const send = (data: string) => {
      reply.raw.write(data);
    };

    if (!agentStreamSubscribers.has(id)) {
      agentStreamSubscribers.set(id, new Set());
    }
    agentStreamSubscribers.get(id)!.add(send);

    // Initial ping
    send(`data: ${JSON.stringify({ type: 'connected', projectId: id })}\n\n`);

    req.raw.on('close', () => {
      agentStreamSubscribers.get(id)?.delete(send);
      if (agentStreamSubscribers.get(id)?.size === 0) {
        agentStreamSubscribers.delete(id);
      }
    });
  });

  // Start Agent Run
  server.post('/api/projects/:id/agent/run', async (req) => {
    const { id } = req.params as { id: string };
    const body = startAgentRunSchema.parse(req.body);
    const workspacePath = workspaceService.getWorkspacePath(id);

    // 1. Get or create conversation & record user message
    const conversation = await conversationRepository.getOrCreateDefaultConversation(id);
    await conversationRepository.addMessage({
      conversationId: conversation.id,
      role: 'user',
      content: body.prompt,
    });

    // 2. Launch Agent Runner asynchronously with real-time SSE broadcasting
    const runPromise = agentRunner.run({
      projectId: id,
      prompt: body.prompt,
      workspacePath,
      modelOverride: body.modelOverride,
      onEvent: (event) => {
        broadcastAgentEvent(id, {
          ...event,
          projectId: id,
        });
      },
    });

    // Await run completion and record assistant response in conversation
    const result = await runPromise;

    if (result.status === 'completed') {
      try {
        await gitService.createCheckpoint(workspacePath, body.prompt);
      } catch {
        // Ignore git status if no file changes
      }
    }

    await conversationRepository.addMessage({
      conversationId: conversation.id,
      role: 'assistant',
      content: result.summary,
    });

    return {
      success: result.status === 'completed',
      result,
    };
  });

  // Get agent runs history for a project
  server.get('/api/projects/:id/agent/runs', async (req) => {
    const { id } = req.params as { id: string };
    const runs = await agentRepository.getRunsByProject(id);
    return { runs };
  });

  // Get conversation chat history for a project
  server.get('/api/projects/:id/agent/messages', async (req) => {
    const { id } = req.params as { id: string };
    const conversation = await conversationRepository.getOrCreateDefaultConversation(id);
    const messages = await conversationRepository.getMessages(conversation.id);
    return { messages };
  });
}
