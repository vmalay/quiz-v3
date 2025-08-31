// Centralized error handling middleware for Express and Socket.IO

import { Request, Response, NextFunction } from 'express';
import { TRPCError } from '@trpc/server';
import { Errors } from '@quiz-battle/shared';

// Type aliases for cleaner code
type AppError = Errors.AppError;
type ErrorSeverity = Errors.ErrorSeverity;
type ValidationError = Errors.ValidationError;
type InternalServerError = Errors.InternalServerError;

const { 
  AppError: AppErrorClass,
  isAppError, 
  isOperationalError,
  getErrorSeverity,
  ErrorSeverity,
  InternalServerError: InternalServerErrorClass,
  ValidationError: ValidationErrorClass
} = Errors;

// Error context interface
export interface ErrorContext {
  requestId?: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  url?: string;
  timestamp: Date;
  additionalData?: Record<string, any>;
}

// Error logger interface
export interface ErrorLogger {
  logError(error: AppError | Error, context: ErrorContext, severity: ErrorSeverity): void;
  logWarning(message: string, context: ErrorContext): void;
  logInfo(message: string, context: ErrorContext): void;
}

// Console-based error logger (can be replaced with Winston, Pino, etc.)
export class ConsoleErrorLogger implements ErrorLogger {
  logError(error: AppError | Error, context: ErrorContext, severity: ErrorSeverity): void {
    const logData = {
      level: 'ERROR',
      severity,
      error: isAppError(error) ? error.toJSON() : {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      timestamp: new Date().toISOString()
    };

    console.error('🚨 ERROR:', JSON.stringify(logData, null, 2));

    // Also log to stderr for critical errors
    if (severity === ErrorSeverity.CRITICAL) {
      console.error('🔥 CRITICAL ERROR - IMMEDIATE ATTENTION REQUIRED:', error.message);
    }
  }

  logWarning(message: string, context: ErrorContext): void {
    const logData = {
      level: 'WARNING',
      message,
      context,
      timestamp: new Date().toISOString()
    };

    console.warn('⚠️ WARNING:', JSON.stringify(logData, null, 2));
  }

  logInfo(message: string, context: ErrorContext): void {
    const logData = {
      level: 'INFO',
      message,
      context,
      timestamp: new Date().toISOString()
    };

    console.log('ℹ️ INFO:', JSON.stringify(logData, null, 2));
  }
}

// Error handler class
export class ErrorHandler {
  constructor(private logger: ErrorLogger = new ConsoleErrorLogger()) {}

  // Extract context from Express request
  private extractContext(req?: Request): ErrorContext {
    return {
      requestId: req?.headers['x-request-id'] as string || crypto.randomUUID(),
      userId: req?.headers['x-user-id'] as string,
      userAgent: req?.get('User-Agent'),
      ip: req?.ip,
      method: req?.method,
      url: req?.originalUrl,
      timestamp: new Date()
    };
  }

  // Handle and log error
  public handleError(error: AppError | Error, context?: Partial<ErrorContext>): AppError {
    const fullContext: ErrorContext = {
      timestamp: new Date(),
      ...context
    };

    // Convert unknown errors to AppError
    const baseError = this.normalizeError(error);
    
    // Determine severity
    const severity = getErrorSeverity(baseError);

    // Log the error
    this.logger.logError(baseError, fullContext, severity);

    // Handle critical errors (might want to alert monitoring systems)
    if (severity === ErrorSeverity.CRITICAL) {
      this.handleCriticalError(baseError, fullContext);
    }

    return baseError;
  }

  // Convert any error to AppError
  private normalizeError(error: AppError | Error): AppError {
    if (isAppError(error)) {
      return error;
    }

    // Handle specific error types
    if (error.name === 'ValidationError') {
      return new ValidationErrorClass(error.message);
    }

    // For unknown errors, create a generic internal server error
    return new InternalServerErrorClass(
      'An unexpected error occurred',
      {
        originalError: error.message,
        originalStack: error.stack
      }
    );
  }

  // Handle critical errors (could integrate with alerting systems)
  private handleCriticalError(error: AppError, context: ErrorContext): void {
    // In production, this could:
    // - Send alerts to Slack/Discord
    // - Create incidents in PagerDuty
    // - Send emails to on-call engineers
    // - Trigger circuit breakers
    
    console.error('🔥 CRITICAL ERROR DETECTED - IMMEDIATE ACTION REQUIRED');
    console.error('Error:', error.message);
    console.error('Context:', context);
    
    // Could also trigger graceful shutdown for unrecoverable errors
    if (!isOperationalError(error)) {
      console.error('⚠️ Non-operational error detected - consider graceful shutdown');
    }
  }

  // Express error handler middleware
  public expressErrorHandler() {
    return (error: AppError | Error, req: Request, res: Response, next: NextFunction) => {
      const context = this.extractContext(req);
      const handledError = this.handleError(error, context);

      // Don't send error details in production for security
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        res.status(handledError.statusCode).json(handledError.toJSON());
      } else {
        res.status(handledError.statusCode).json(handledError.toAPIResponse());
      }
    };
  }

  // Express async wrapper to catch async errors
  public asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // tRPC error transformer
  public transformTRPCError(error: AppError | Error): TRPCError {
    const baseError = this.normalizeError(error);
    
    // Map HTTP status codes to tRPC error codes
    const tRPCCodeMap: Record<number, TRPCError['code']> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR'
    };

    const tRPCCode = tRPCCodeMap[baseError.statusCode] || 'INTERNAL_SERVER_ERROR';

    return new TRPCError({
      code: tRPCCode,
      message: baseError.message,
      cause: baseError
    });
  }

  // Socket.IO error handler
  public socketErrorHandler(socket: any) {
    return (error: AppError | Error, eventData?: any) => {
      const context: ErrorContext = {
        requestId: crypto.randomUUID(),
        timestamp: new Date(),
        additionalData: {
          socketId: socket.id,
          eventData
        }
      };

      const handledError = this.handleError(error, context);

      // Emit error to client
      socket.emit('error', handledError.toAPIResponse());
    };
  }

  // Promise rejection handler for global errors
  public handleUnhandledRejection(reason: any, promise: Promise<any>): void {
    const context: ErrorContext = {
      requestId: crypto.randomUUID(),
      timestamp: new Date(),
      additionalData: {
        rejectionReason: reason,
        promise: promise.toString()
      }
    };

    const error = new InternalServerErrorClass('Unhandled Promise Rejection', {
      reason: typeof reason === 'string' ? reason : JSON.stringify(reason)
    });

    this.handleError(error, context);

    // In production, you might want to gracefully shutdown
    if (process.env.NODE_ENV === 'production') {
      console.error('Unhandled promise rejection - considering graceful shutdown');
      // process.exit(1); // Uncomment for immediate shutdown
    }
  }

  // Uncaught exception handler
  public handleUncaughtException(error: Error): void {
    const context: ErrorContext = {
      requestId: crypto.randomUUID(),
      timestamp: new Date(),
      additionalData: {
        uncaughtException: true
      }
    };

    const handledError = this.handleError(error, context);

    // Uncaught exceptions are always critical
    console.error('🔥 UNCAUGHT EXCEPTION - SHUTTING DOWN');
    
    // Gracefully shutdown
    process.exit(1);
  }
}

// Global error handler singleton
export const globalErrorHandler = new ErrorHandler();

// Express middleware factory
export const createErrorMiddleware = (logger?: ErrorLogger) => {
  const handler = logger ? new ErrorHandler(logger) : globalErrorHandler;
  return handler.expressErrorHandler();
};

// Async wrapper utility
export const asyncHandler = globalErrorHandler.asyncHandler.bind(globalErrorHandler);

// Setup global error handlers
export const setupGlobalErrorHandlers = (logger?: ErrorLogger) => {
  const handler = logger ? new ErrorHandler(logger) : globalErrorHandler;

  // Handle unhandled promise rejections
  process.on('unhandledRejection', handler.handleUnhandledRejection.bind(handler));

  // Handle uncaught exceptions
  process.on('uncaughtException', handler.handleUncaughtException.bind(handler));

  // Graceful shutdown on SIGTERM
  process.on('SIGTERM', () => {
    console.log('📡 SIGTERM received - graceful shutdown initiated');
    // Perform cleanup here
    process.exit(0);
  });

  // Graceful shutdown on SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    console.log('📡 SIGINT received - graceful shutdown initiated');
    // Perform cleanup here
    process.exit(0);
  });
};

// Request ID middleware
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Use existing request ID or generate new one
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  
  // Add to request headers
  req.headers['x-request-id'] = requestId;
  
  // Add to response headers for tracing
  res.setHeader('X-Request-ID', requestId);
  
  next();
};

// Error boundary for React components (to be used in frontend)
export const ErrorBoundaryContext = {
  createErrorInfo: (error: Error, errorInfo: { componentStack: string }) => ({
    name: error.name,
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    url: typeof globalThis !== 'undefined' && 'location' in globalThis ? (globalThis as any).location.href : 'unknown',
    userAgent: typeof globalThis !== 'undefined' && 'navigator' in globalThis ? (globalThis as any).navigator.userAgent : 'unknown'
  })
};

// Type guards for error checking
export const isValidationError = (error: unknown): error is ValidationError => {
  return error instanceof ValidationErrorClass;
};

export const isCriticalError = (error: unknown): boolean => {
  return isAppError(error) && getErrorSeverity(error) === ErrorSeverity.CRITICAL;
};

// Metrics collection interface (can be implemented with Prometheus, etc.)
export interface ErrorMetrics {
  incrementErrorCount(errorCode: string, statusCode: number): void;
  recordErrorDuration(duration: number): void;
  recordErrorSeverity(severity: ErrorSeverity): void;
}

// Basic metrics collector
export class BasicErrorMetrics implements ErrorMetrics {
  private errorCounts = new Map<string, number>();
  private errorDurations: number[] = [];
  private severityCounts = new Map<ErrorSeverity, number>();

  incrementErrorCount(errorCode: string, statusCode: number): void {
    const key = `${errorCode}_${statusCode}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
  }

  recordErrorDuration(duration: number): void {
    this.errorDurations.push(duration);
    
    // Keep only last 1000 durations to prevent memory leaks
    if (this.errorDurations.length > 1000) {
      this.errorDurations = this.errorDurations.slice(-1000);
    }
  }

  recordErrorSeverity(severity: ErrorSeverity): void {
    this.severityCounts.set(severity, (this.severityCounts.get(severity) || 0) + 1);
  }

  getStats() {
    return {
      errorCounts: Object.fromEntries(this.errorCounts),
      averageErrorDuration: this.errorDurations.length > 0 
        ? this.errorDurations.reduce((a, b) => a + b, 0) / this.errorDurations.length 
        : 0,
      severityCounts: Object.fromEntries(this.severityCounts),
      totalErrors: Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0)
    };
  }
}

export const errorMetrics = new BasicErrorMetrics();