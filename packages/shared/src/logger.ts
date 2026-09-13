/**
 * Structured Logger for CodeCraft applications and services.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  metadata?: Record<string, unknown>;
}

export class Logger {
  constructor(private context: string = 'CodeCraft') {}

  private formatLog(level: LogLevel, message: string, metadata?: Record<string, unknown>): LogPayload {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      metadata,
    };
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    if (process.env.LOG_LEVEL === 'debug') {
      console.debug(JSON.stringify(this.formatLog('debug', message, metadata)));
    }
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    console.info(JSON.stringify(this.formatLog('info', message, metadata)));
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    console.warn(JSON.stringify(this.formatLog('warn', message, metadata)));
  }

  error(message: string, metadata?: Record<string, unknown>): void {
    console.error(JSON.stringify(this.formatLog('error', message, metadata)));
  }
}

export const logger = new Logger('CodeCraft');
