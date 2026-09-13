/**
 * Secret sanitizer utility for masking sensitive credentials in logs, tool outputs, and telemetry.
 */

const SENSITIVE_KEYS = new Set([
  'password',
  'secret',
  'apikey',
  'api_key',
  'token',
  'accesstoken',
  'access_token',
  'authorization',
]);

export function sanitizeSecrets(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let sanitized = text;

  // Mask more specific patterns first
  sanitized = sanitized.replace(/sk-ant-[a-zA-Z0-9_-]{10,}/gi, '[REDACTED_ANTHROPIC_KEY]');
  sanitized = sanitized.replace(/sk-or-v1-[a-zA-Z0-9_-]{10,}/gi, '[REDACTED_OPENROUTER_KEY]');
  sanitized = sanitized.replace(/sk-[a-zA-Z0-9_-]{20,}/gi, '[REDACTED_API_KEY]');
  sanitized = sanitized.replace(/gh[pousr][_-][a-zA-Z0-9]{15,}/gi, '[REDACTED_GITHUB_TOKEN]');
  sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9._-]{15,}/gi, 'Bearer [REDACTED_TOKEN]');

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
    const isKeySensitive = SENSITIVE_KEYS.has(key.toLowerCase());
    if (isKeySensitive && typeof value === 'string') {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      result[key] = sanitizeSecrets(value);
    } else if (typeof value === 'object') {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
