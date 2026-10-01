import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelV1 } from 'ai';
import { ResolvedModelConfig } from '../types.js';

// Cache to preserve Google Gemini thought_signatures by tool_call_id across multi-turn calls
const signatureCache = new Map<string, string>();

const customGeminiFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  if (options?.body && typeof options.body === 'string') {
    try {
      const body = JSON.parse(options.body);
      if (body.messages && Array.isArray(body.messages)) {
        let modified = false;
        for (const msg of body.messages) {
          if (msg.role === 'assistant' && Array.isArray(msg.tool_calls)) {
            for (const tc of msg.tool_calls) {
              const cachedSig = signatureCache.get(tc.id);
              if (cachedSig && (!tc.extra_content || !tc.extra_content.google)) {
                tc.extra_content = { google: { thought_signature: cachedSig } };
                modified = true;
              }
            }
          }
        }
        if (modified) {
          options = {
            ...options,
            body: JSON.stringify(body),
          };
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  const res = await fetch(url, options);

  // Intercept response to extract and cache thought_signature
  const clone = res.clone();
  try {
    const data = await clone.json();
    if (data?.choices && Array.isArray(data.choices)) {
      for (const choice of data.choices) {
        if (choice.message?.tool_calls && Array.isArray(choice.message.tool_calls)) {
          for (const tc of choice.message.tool_calls) {
            const sig = tc.extra_content?.google?.thought_signature;
            if (sig && tc.id) {
              signatureCache.set(tc.id, sig);
            }
          }
        }
      }
    }
  } catch {
    // Ignore response JSON parse errors
  }

  return res;
};

export function createGeminiModel(config: ResolvedModelConfig): LanguageModelV1 {
  const apiKey = config.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';

  if (!apiKey) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(
        'Missing Gemini API Key. Please provide a valid Google AI / Gemini API key in Settings, Onboarding, or the GEMINI_API_KEY environment variable. Get one free at https://aistudio.google.com/app/apikey'
      );
    }
  }

  const googleGemini = createOpenAI({
    apiKey: apiKey || 'mock-key',
    baseURL: config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai',
    fetch: customGeminiFetch as typeof fetch,
  });

  return googleGemini(config.model);
}
