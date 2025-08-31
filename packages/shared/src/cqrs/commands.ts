// CQRS Commands - Write operations with business intent

import { PlayerId, GameId, AnswerIndex } from '../domain/value-objects';

// Base command interface
export interface Command {
  readonly commandId: string;
  readonly timestamp: Date;
  readonly correlationId?: string;
  readonly userId?: string;
}

export abstract class BaseCommand implements Command {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly correlationId?: string,
    public readonly userId?: string
  ) {
    this.commandId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

// Game Commands
export class CreateGameCommand extends BaseCommand {
  constructor(
    public readonly gameId: GameId,
    public readonly player1Id: PlayerId,
    public readonly themeId: string,
    correlationId?: string,
    userId?: string
  ) {
    super(correlationId, userId);
  }
}

export class JoinGameCommand extends BaseCommand {
  constructor(
    public readonly gameId: GameId,
    public readonly playerId: PlayerId,
    correlationId?: string,
    userId?: string
  ) {
    super(correlationId, userId);
  }
}

export class StartGameCommand extends BaseCommand {
  constructor(
    public readonly gameId: GameId,
    correlationId?: string,
    userId?: string
  ) {
    super(correlationId, userId);
  }
}

export class SubmitAnswerCommand extends BaseCommand {
  constructor(
    public readonly gameId: GameId,
    public readonly playerId: PlayerId,
    public readonly questionId: string,
    public readonly selectedAnswer: AnswerIndex,
    public readonly responseTimeMs: number,
    correlationId?: string,
    userId?: string
  ) {
    super(correlationId, userId);
  }
}

export class EndQuestionCommand extends BaseCommand {
  constructor(
    public readonly gameId: GameId,
    correlationId?: string,
    userId?: string
  ) {
    super(correlationId, userId);
  }
}

export class CompleteGameCommand extends BaseCommand {
  constructor(
    public readonly gameId: GameId,
    correlationId?: string,
    userId?: string
  ) {
    super(correlationId, userId);
  }
}

export class CancelGameCommand extends BaseCommand {
  constructor(
    public readonly gameId: GameId,
    public readonly reason: string,
    correlationId?: string,
    userId?: string
  ) {
    super(correlationId, userId);
  }
}

// Command validation
export interface CommandValidator<T extends Command> {
  validate(command: T): Promise<ValidationResult>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Command handler interface
export interface CommandHandler<T extends Command> {
  handle(command: T): Promise<CommandResult>;
  canHandle(command: Command): boolean;
}

export interface CommandResult {
  success: boolean;
  aggregateId?: string;
  version?: number;
  errors?: ValidationError[];
}

// Command bus for dispatching
export interface CommandBus {
  send<T extends Command>(command: T): Promise<CommandResult>;
  register<T extends Command>(
    commandType: string,
    handler: CommandHandler<T>
  ): void;
}

// Command middleware for cross-cutting concerns
export interface CommandMiddleware {
  execute<T extends Command>(
    command: T,
    next: (command: T) => Promise<CommandResult>
  ): Promise<CommandResult>;
}

// Pre-built middleware
export class ValidationMiddleware implements CommandMiddleware {
  constructor(private validators: Map<string, CommandValidator<any>>) {}

  async execute<T extends Command>(
    command: T,
    next: (command: T) => Promise<CommandResult>
  ): Promise<CommandResult> {
    const validator = this.validators.get(command.constructor.name);
    if (validator) {
      const validationResult = await validator.validate(command);
      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors
        };
      }
    }
    return next(command);
  }
}

export class LoggingMiddleware implements CommandMiddleware {
  async execute<T extends Command>(
    command: T,
    next: (command: T) => Promise<CommandResult>
  ): Promise<CommandResult> {
    console.log(`Executing command: ${command.constructor.name}`, {
      commandId: command.commandId,
      timestamp: command.timestamp,
      correlationId: command.correlationId
    });

    const startTime = Date.now();
    try {
      const result = await next(command);
      const duration = Date.now() - startTime;
      
      console.log(`Command completed: ${command.constructor.name}`, {
        commandId: command.commandId,
        success: result.success,
        duration
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Command failed: ${command.constructor.name}`, {
        commandId: command.commandId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      throw error;
    }
  }
}

export class AuthorizationMiddleware implements CommandMiddleware {
  constructor(private authService: AuthorizationService) {}

  async execute<T extends Command>(
    command: T,
    next: (command: T) => Promise<CommandResult>
  ): Promise<CommandResult> {
    if (command.userId) {
      const isAuthorized = await this.authService.isAuthorized(
        command.userId,
        command.constructor.name
      );
      
      if (!isAuthorized) {
        return {
          success: false,
          errors: [{
            field: 'authorization',
            message: 'User not authorized to execute this command',
            code: 'UNAUTHORIZED'
          }]
        };
      }
    }
    
    return next(command);
  }
}

interface AuthorizationService {
  isAuthorized(userId: string, commandType: string): Promise<boolean>;
}

// Command scheduling for delayed execution
export interface CommandScheduler {
  schedule<T extends Command>(
    command: T,
    executeAt: Date
  ): Promise<ScheduledCommand>;
  
  cancel(scheduledCommandId: string): Promise<void>;
}

export interface ScheduledCommand {
  id: string;
  command: Command;
  executeAt: Date;
  status: 'SCHEDULED' | 'EXECUTED' | 'CANCELLED' | 'FAILED';
}

// Saga commands for complex workflows
export class StartGameSagaCommand extends BaseCommand {
  constructor(
    public readonly gameId: GameId,
    public readonly player1Id: PlayerId,
    public readonly player2Id: PlayerId,
    public readonly themeId: string,
    correlationId?: string,
    userId?: string
  ) {
    super(correlationId, userId);
  }
}