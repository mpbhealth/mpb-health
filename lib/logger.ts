import Constants from 'expo-constants';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = __DEV__;
    this.isProduction = !__DEV__;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true;
    }

    if (this.isProduction) {
      return level === 'warn' || level === 'error';
    }

    return false;
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const errorContext = {
        ...context,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      };
      console.error(this.formatMessage('error', message, errorContext));
    }
  }

  logAuthEvent(event: string, userId?: string, context?: LogContext): void {
    this.info(`Auth: ${event}`, { userId, ...context });
  }

  logApiCall(endpoint: string, method: string, duration?: number, context?: LogContext): void {
    this.debug(`API: ${method} ${endpoint}`, { duration, ...context });
  }

  logNavigation(screen: string, params?: any): void {
    this.debug(`Navigation: ${screen}`, { params });
  }

  logPerformance(metric: string, value: number, context?: LogContext): void {
    this.info(`Performance: ${metric}`, { value, ...context });
  }
}

export const logger = new Logger();
