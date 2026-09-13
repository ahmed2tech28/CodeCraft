/**
 * Secret sanitizer utility for masking sensitive credentials in logs, tool outputs, and telemetry.
 */

const SENSITIVE_PATTERNS = [
  // OpenAI / generic sk- keys
  /sk-[a-zA-Z0-9_-]{20,}/gi,
  // Anthropic api keys (sk-ant-...)
  /sk-ant-[a-zA-Z0-9_-]{20,}/gi,
  // OpenRouter keys
  /sk-or-v1-[a-zA-Z0-9_-]{20,}/gi,
  // GitHub tokens
  /gh[pousr]-[a-zA-Z0-9]{20,}/gi,
  // Bearer tokens
  /Bearer\s+[a-zA-Z0-9._-]{20,}/gi,
  // Generic password fields in JSON/strings
  /("?(?:password|secret|api_key|apiKey|token)"?\s*[:=]\s*)"([^"]+)"/gi,
];

export function sanitizeSecrets(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let sanitized = text;

  // Mask known API key patterns
  sanitized = sanitized.replace(/sk-[a-zA-Z0-9_-]{20,}/gi, '[REDACTED_API_KEY]');
  sanitized = sanitized.replace(/sk-ant-[a-zA-Z0-9_-]{20,}/gi, '[REDACTED_ANTHROPIC_KEY]');
  sanitized = sanitized.replace(/sk-or-v1-[a-zA-Z0-9_-]{20,}/gi, '[REDACTED_OPENROUTER_KEY]');
  sanitized = sanitized.replace(/gh[pousr]-[a-zA-Z0-9]{20,}/gi, '[REDACTED_GITHUB_TOKEN]');
  sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9._-]{20,}/gi, 'Bearer [REDACTED_TOKEN]');

  // Mask JSON password/secret properties
  sanitized = sanitized.replace(
    /("?(?:password|secret|api_key|apiKey|token)"?\s*[:=]\s*)"([^"]+)"/gi,
    '$1"[REDACTED]"'
  );

  return sanitized;
}

export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeSecrets(obj) as unknown as T;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeSecrets(value);
    } else if (typeof value === 'object') {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
