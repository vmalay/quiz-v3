// Simplified error classes to get the system working quickly

export class AppError extends Error {
  public readonly statusCode: number;
  public errorCode: string;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack
    };
  }

  toAPIResponse(): Record<string, any> {
    return {
      error: {
        code: this.errorCode,
        message: this.message,
        timestamp: this.timestamp.toISOString()
      }
    };
  }
}

// Common error types
export class ValidationError extends AppError {
  constructor(message: string, field?: string, context?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', true, { ...context, field });
  }
}

export class NotFoundError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 404, 'NOT_FOUND', true, context);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', context?: Record<string, any>) {
    super(message, 401, 'UNAUTHORIZED', true, context);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', context?: Record<string, any>) {
    super(message, 403, 'FORBIDDEN', true, context);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, context?: Record<string, any>) {
    super(message, 409, 'CONFLICT', true, context);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error', context?: Record<string, any>) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false, context);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', true, { retryAfter });
  }
}

// Game-specific errors
export class GameNotFoundError extends NotFoundError {
  constructor(gameId: string) {
    super(`Game with id '${gameId}' not found`, { gameId });
    this.errorCode = 'GAME_NOT_FOUND';
  }
}

export class GameFullError extends ConflictError {
  constructor(gameId: string) {
    super(`Game '${gameId}' is full`, { gameId });
    this.errorCode = 'GAME_FULL';
  }
}

export class PlayerNotInGameError extends ForbiddenError {
  constructor(playerId: string, gameId: string) {
    super(`Player '${playerId}' is not in game '${gameId}'`, { playerId, gameId });
    this.errorCode = 'PLAYER_NOT_IN_GAME';
  }
}

export class InvalidAnswerError extends ValidationError {
  constructor(answerIndex: number) {
    super(`Answer index ${answerIndex} is invalid`, 'answerIndex', { answerIndex });
    this.errorCode = 'INVALID_ANSWER';
  }
}

// Type guards
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational;
}

// Error severity
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export function getErrorSeverity(error: AppError): ErrorSeverity {
  if (!error.isOperational) return ErrorSeverity.CRITICAL;
  if (error.statusCode >= 500) return ErrorSeverity.HIGH;
  if (error.statusCode >= 400) return ErrorSeverity.MEDIUM;
  return ErrorSeverity.LOW;
}