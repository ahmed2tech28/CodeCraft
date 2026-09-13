import { generateText } from 'ai';
import { getLanguageModel } from '@codecraft/ai';
import { agentRepository, providerRepository } from '@codecraft/db';
import { sanitizeSecrets, sanitizeObject } from '@codecraft/shared';
import { CODECRAFT_SYSTEM_PROMPT } from './system-prompt.js';
import { createAgentTools } from './tools/index.js';
import {
  AgentContext,
  AgentStepEvent,
  RunAgentOptions,
  RunAgentResult,
} from './types.js';

export class AgentRunner {
  /**
   * Executes an autonomous coding agent run on a project workspace.
   */
  async run(options: RunAgentOptions): Promise<RunAgentResult> {
    const startTime = Date.now();
    const filesModified = new Set<string>();

    // 1. Record Agent Run in Database
    const dbRun = await agentRepository.createRun({
      projectId: options.projectId,
      prompt: options.prompt,
    });
    const runId = dbRun.id;

    // 2. Event emitter wrapper
    const emitEvent = (event: AgentStepEvent) => {
      // Redact sensitive keys from streamed events
      if (event.text) event.text = sanitizeSecrets(event.text);
      if (event.error) event.error = sanitizeSecrets(event.error);
      if (event.toolInput) event.toolInput = sanitizeObject(event.toolInput);
      if (event.toolOutput) event.toolOutput = sanitizeObject(event.toolOutput);
      options.onEvent?.(event);
    };

    emitEvent({
      type: 'status',
      status: 'planning',
      text: `Initializing agent run for: "${options.prompt}"`,
      timestamp: new Date().toISOString(),
    });

    // 3. Resolve AI Language Model from DB Config or Environment
    const activeDbConfig = await providerRepository.getActiveConfig();

    const resolvedProvider =
      options.providerOverride ||
      (activeDbConfig?.provider as 'openai' | 'anthropic' | 'openrouter' | 'ollama') ||
      undefined;

    const resolvedModel = options.modelOverride || activeDbConfig?.model || undefined;
    const resolvedApiKey = options.apiKeyOverride || activeDbConfig?.apiKeyEncrypted || undefined;
    const resolvedBaseUrl = options.baseUrlOverride || activeDbConfig?.baseUrl || undefined;

    const { model, config: activeConfig } = getLanguageModel({
      provider: resolvedProvider,
      model: resolvedModel,
      apiKey: resolvedApiKey,
      baseUrl: resolvedBaseUrl,
    });

    emitEvent({
      type: 'status',
      status: 'coding',
      text: `Using ${activeConfig.provider} (${activeConfig.model})`,
      timestamp: new Date().toISOString(),
    });

    // 4. Initialize Context & Tools
    const context: AgentContext = {
      projectId: options.projectId,
      workspacePath: options.workspacePath,
      containerId: options.containerId,
      runId,
      emitEvent: (event) => {
        if (event.type === 'file_change' && event.filePath) {
          filesModified.add(event.filePath);
        }
        emitEvent(event);
      },
    };

    const tools = createAgentTools(context);

    try {
      await agentRepository.updateRunStatus(runId, 'coding');

      // 5. Execute Multi-Turn Agent Loop
      const result = await generateText({
        model,
        system: CODECRAFT_SYSTEM_PROMPT,
        prompt: `User Request: "${options.prompt}"\n\nInspect the project files, plan your changes, create/update components, and ensure the app is fully working.`,
        tools,
        maxSteps: options.maxSteps || 15,
        onStepFinish: async (step) => {
          // Record any tool calls made in this turn
          if (step.toolCalls && step.toolCalls.length > 0) {
            for (const call of step.toolCalls) {
              const toolResultObj = step.toolResults?.find(
                (r) => r.toolCallId === call.toolCallId
              );

              const sanitizedInput = sanitizeObject(call.args as Record<string, unknown>);
              const sanitizedOutput = sanitizeObject(toolResultObj?.result as Record<string, unknown>);

              emitEvent({
                type: 'tool_call',
                toolName: call.toolName,
                toolInput: sanitizedInput,
                toolOutput: sanitizedOutput,
                timestamp: new Date().toISOString(),
              });

              await agentRepository.recordToolCall({
                agentRunId: runId,
                toolName: call.toolName,
                input: sanitizedInput,
                output: sanitizedOutput,
                status: 'success',
              });
            }
          }

          if (step.text) {
            emitEvent({
              type: 'thinking',
              text: sanitizeSecrets(step.text),
              timestamp: new Date().toISOString(),
            });
          }
        },
      });

      const durationMs = Date.now() - startTime;

      // 6. Complete Run in Database
      await agentRepository.updateRunStatus(runId, 'completed', {
        durationMs,
        tokensUsed: result.usage?.totalTokens || 0,
      });

      emitEvent({
        type: 'complete',
        status: 'completed',
        text: sanitizeSecrets(result.text || 'Application changes completed successfully.'),
        timestamp: new Date().toISOString(),
      });

      return {
        runId,
        projectId: options.projectId,
        status: 'completed',
        summary: sanitizeSecrets(result.text || 'Completed successfully'),
        totalSteps: result.steps?.length || 1,
        filesModified: Array.from(filesModified),
        durationMs,
      };
    } catch (err: unknown) {
      const durationMs = Date.now() - startTime;
      const rawErrorMsg = err instanceof Error ? err.message : String(err);
      const errorMsg = sanitizeSecrets(rawErrorMsg);

      await agentRepository.updateRunStatus(runId, 'failed', {
        durationMs,
        error: errorMsg,
      });

      emitEvent({
        type: 'error',
        status: 'failed',
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });

      return {
        runId,
        projectId: options.projectId,
        status: 'failed',
        summary: `Execution failed: ${errorMsg}`,
        totalSteps: 0,
        filesModified: Array.from(filesModified),
        durationMs,
        error: errorMsg,
      };
    }
  }
}

export const agentRunner = new AgentRunner();
