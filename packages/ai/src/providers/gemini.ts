import { createOpenAI } from '@ai-sdk/openai';
import { LanguageModelV1 } from 'ai';
import { ResolvedModelConfig } from '../types.js';

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
  });

  return googleGemini(config.model);
}
