// Domain Exceptions - Business rule violations and domain errors

export abstract class DomainException extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class GameNotFoundError extends DomainException {
  constructor(gameId: string) {
    super(`Game with ID '${gameId}' was not found`, 'GAME_NOT_FOUND');
  }
}

export class GameAlreadyStartedError extends DomainException {
  constructor(gameId: string) {
    super(`Game '${gameId}' has already started`, 'GAME_ALREADY_STARTED');
  }
}

export class GameNotStartedError extends DomainException {
  constructor(gameId: string) {
    super(`Game '${gameId}' has not started yet`, 'GAME_NOT_STARTED');
  }
}

export class GameAlreadyCompletedError extends DomainException {
  constructor(gameId: string) {
    super(`Game '${gameId}' has already been completed`, 'GAME_ALREADY_COMPLETED');
  }
}

export class PlayerNotInGameError extends DomainException {
  constructor(playerId: string, gameId: string) {
    super(`Player '${playerId}' is not part of game '${gameId}'`, 'PLAYER_NOT_IN_GAME');
  }
}

export class PlayerAlreadyAnsweredError extends DomainException {
  constructor(playerId: string, questionId: string) {
    super(`Player '${playerId}' has already answered question '${questionId}'`, 'PLAYER_ALREADY_ANSWERED');
  }
}

export class InvalidAnswerError extends DomainException {
  constructor(answerIndex: number) {
    super(`Answer index '${answerIndex}' is invalid. Must be between 0 and 3`, 'INVALID_ANSWER');
  }
}

export class QuestionTimeExpiredError extends DomainException {
  constructor(questionId: string) {
    super(`Time has expired for question '${questionId}'`, 'QUESTION_TIME_EXPIRED');
  }
}

export class GameFullError extends DomainException {
  constructor(gameId: string) {
    super(`Game '${gameId}' is already full`, 'GAME_FULL');
  }
}

export class InsufficientQuestionsError extends DomainException {
  constructor(themeId: string, required: number, available: number) {
    super(
      `Theme '${themeId}' has insufficient questions. Required: ${required}, Available: ${available}`,
      'INSUFFICIENT_QUESTIONS'
    );
  }
}

export class ThemeNotFoundError extends DomainException {
  constructor(themeId: string) {
    super(`Theme with ID '${themeId}' was not found`, 'THEME_NOT_FOUND');
  }
}

export class ThemeNotActiveError extends DomainException {
  constructor(themeId: string) {
    super(`Theme '${themeId}' is not active`, 'THEME_NOT_ACTIVE');
  }
}

export class InvalidGameStateTransitionError extends DomainException {
  constructor(currentState: string, targetState: string) {
    super(
      `Invalid state transition from '${currentState}' to '${targetState}'`,
      'INVALID_STATE_TRANSITION'
    );
  }
}

export class ConcurrencyError extends DomainException {
  constructor(entityType: string, entityId: string) {
    super(
      `Concurrency conflict detected for ${entityType} '${entityId}'. Entity was modified by another process`,
      'CONCURRENCY_CONFLICT'
    );
  }
}