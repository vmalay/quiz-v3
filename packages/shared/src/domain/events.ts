// Domain Events - Things that happened in the domain that other parts care about

import { GameId, PlayerId } from './value-objects';
import { Game } from './aggregates';
import { Question, Answer } from './entities';

export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;

  constructor() {
    this.occurredOn = new Date();
    this.eventId = crypto.randomUUID();
  }

  abstract getEventName(): string;
}

export class GameStartedEvent extends DomainEvent {
  constructor(
    public readonly gameId: GameId,
    public readonly game: Game,
    public readonly firstQuestion: Question
  ) {
    super();
  }

  getEventName(): string {
    return 'GameStarted';
  }
}

export class QuestionStartedEvent extends DomainEvent {
  constructor(
    public readonly gameId: GameId,
    public readonly question: Question,
    public readonly questionIndex: number,
    public readonly timeLimit: number
  ) {
    super();
  }

  getEventName(): string {
    return 'QuestionStarted';
  }
}

export class PlayerAnsweredEvent extends DomainEvent {
  constructor(
    public readonly gameId: GameId,
    public readonly playerId: PlayerId,
    public readonly answer: Answer,
    public readonly pointsAwarded: number
  ) {
    super();
  }

  getEventName(): string {
    return 'PlayerAnswered';
  }
}

export class QuestionCompletedEvent extends DomainEvent {
  constructor(
    public readonly gameId: GameId,
    public readonly question: Question,
    public readonly correctAnswer: number,
    public readonly playerScores: Map<string, number>
  ) {
    super();
  }

  getEventName(): string {
    return 'QuestionCompleted';
  }
}

export class GameCompletedEvent extends DomainEvent {
  constructor(
    public readonly gameId: GameId,
    public readonly game: Game,
    public readonly winnerId: PlayerId | undefined,
    public readonly finalScores: Map<string, number>
  ) {
    super();
  }

  getEventName(): string {
    return 'GameCompleted';
  }
}

export class PlayerJoinedGameEvent extends DomainEvent {
  constructor(
    public readonly gameId: GameId,
    public readonly playerId: PlayerId,
    public readonly game: Game
  ) {
    super();
  }

  getEventName(): string {
    return 'PlayerJoinedGame';
  }
}

export class PlayerDisconnectedEvent extends DomainEvent {
  constructor(
    public readonly gameId: GameId,
    public readonly playerId: PlayerId
  ) {
    super();
  }

  getEventName(): string {
    return 'PlayerDisconnected';
  }
}

export class GameCancelledEvent extends DomainEvent {
  constructor(
    public readonly gameId: GameId,
    public readonly reason: string
  ) {
    super();
  }

  getEventName(): string {
    return 'GameCancelled';
  }
}

// Event publisher interface
export interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}

// Event handler interface
export interface DomainEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
  canHandle(event: DomainEvent): boolean;
}