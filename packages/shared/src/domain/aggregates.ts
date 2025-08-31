// Aggregates - Cluster of domain objects that can be treated as a single unit

import { GameId, PlayerId, Score, ResponseTime, AnswerIndex } from './value-objects';
import { Question, Answer, Player, GameStatus, QuestionDifficulty } from './entities';
import { 
  DomainEvent, 
  GameStartedEvent, 
  QuestionStartedEvent, 
  PlayerAnsweredEvent, 
  QuestionCompletedEvent, 
  GameCompletedEvent,
  PlayerJoinedGameEvent,
  GameCancelledEvent
} from './events';
import {
  GameNotFoundError,
  GameAlreadyStartedError,
  GameNotStartedError,
  GameAlreadyCompletedError,
  PlayerNotInGameError,
  PlayerAlreadyAnsweredError,
  GameFullError,
  InvalidGameStateTransitionError,
  QuestionTimeExpiredError
} from './exceptions';

// Game Aggregate Root
export class Game {
  private domainEvents: DomainEvent[] = [];
  private currentQuestionStartTime?: Date;
  private playersAnswered = new Set<string>();

  constructor(
    private readonly id: GameId,
    private readonly player1Id: PlayerId,
    private readonly themeId: string,
    private status: GameStatus = GameStatus.WAITING,
    private player2Id?: PlayerId,
    private winnerId?: PlayerId,
    private player1Score: Score = Score.zero(),
    private player2Score: Score = Score.zero(),
    private currentQuestionIndex: number = 0,
    private readonly createdAt: Date = new Date(),
    private completedAt?: Date
  ) {}

  // Factory methods
  static create(player1Id: PlayerId, themeId: string): Game {
    const gameId = GameId.generate();
    return new Game(gameId, player1Id, themeId);
  }

  static reconstitute(
    id: string,
    player1Id: string,
    themeId: string,
    status: GameStatus,
    player2Id?: string,
    winnerId?: string,
    player1Score: number = 0,
    player2Score: number = 0,
    currentQuestionIndex: number = 0,
    createdAt: Date = new Date(),
    completedAt?: Date
  ): Game {
    return new Game(
      GameId.create(id),
      PlayerId.create(player1Id),
      themeId,
      status,
      player2Id ? PlayerId.create(player2Id) : undefined,
      winnerId ? PlayerId.create(winnerId) : undefined,
      Score.create(player1Score),
      Score.create(player2Score),
      currentQuestionIndex,
      createdAt,
      completedAt
    );
  }

  // Getters
  getId(): GameId {
    return this.id;
  }

  getPlayer1Id(): PlayerId {
    return this.player1Id;
  }

  getPlayer2Id(): PlayerId | undefined {
    return this.player2Id;
  }

  getThemeId(): string {
    return this.themeId;
  }

  getStatus(): GameStatus {
    return this.status;
  }

  getWinnerId(): PlayerId | undefined {
    return this.winnerId;
  }

  getPlayer1Score(): Score {
    return this.player1Score;
  }

  getPlayer2Score(): Score {
    return this.player2Score;
  }

  getCurrentQuestionIndex(): number {
    return this.currentQuestionIndex;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getCompletedAt(): Date | undefined {
    return this.completedAt ? new Date(this.completedAt) : undefined;
  }

  // Business behavior
  canPlayerJoin(playerId: PlayerId): boolean {
    if (this.status !== GameStatus.WAITING) {
      return false;
    }
    if (this.player2Id) {
      return false; // Game is full
    }
    if (this.player1Id.equals(playerId)) {
      return false; // Player already in game
    }
    return true;
  }

  addPlayer2(playerId: PlayerId): void {
    if (!this.canPlayerJoin(playerId)) {
      throw new GameFullError(this.id.getValue());
    }

    this.player2Id = playerId;
    this.addDomainEvent(new PlayerJoinedGameEvent(this.id, playerId, this));
  }

  canStart(): boolean {
    return this.status === GameStatus.WAITING && this.player2Id !== undefined;
  }

  start(questions: Question[]): void {
    if (!this.canStart()) {
      throw new GameAlreadyStartedError(this.id.getValue());
    }

    if (questions.length < 5) {
      throw new Error('Game requires at least 5 questions');
    }

    this.status = GameStatus.ACTIVE;
    this.addDomainEvent(new GameStartedEvent(this.id, this, questions[0]));
  }

  startQuestion(question: Question, timeLimit: number): void {
    if (this.status !== GameStatus.ACTIVE) {
      throw new GameNotStartedError(this.id.getValue());
    }

    this.currentQuestionStartTime = new Date();
    this.playersAnswered.clear();
    
    this.addDomainEvent(new QuestionStartedEvent(
      this.id, 
      question, 
      this.currentQuestionIndex, 
      timeLimit
    ));
  }

  canPlayerAnswer(playerId: PlayerId): boolean {
    if (this.status !== GameStatus.ACTIVE) {
      return false;
    }
    
    if (!this.isPlayerInGame(playerId)) {
      return false;
    }

    if (this.playersAnswered.has(playerId.getValue())) {
      return false;
    }

    return true;
  }

  submitAnswer(
    playerId: PlayerId, 
    question: Question, 
    answerIndex: AnswerIndex,
    responseTime: ResponseTime
  ): { points: number; answer: Answer } {
    if (!this.canPlayerAnswer(playerId)) {
      if (this.playersAnswered.has(playerId.getValue())) {
        throw new PlayerAlreadyAnsweredError(playerId.getValue(), question.getId());
      }
      throw new PlayerNotInGameError(playerId.getValue(), this.id.getValue());
    }

    const answer = Answer.create(this.id, playerId, question, answerIndex, responseTime);
    let points = 0;

    if (answer.isAnswerCorrect()) {
      points = question.calculatePoints(responseTime);
      this.addPointsToPlayer(playerId, points);
    }

    this.playersAnswered.add(playerId.getValue());
    this.addDomainEvent(new PlayerAnsweredEvent(this.id, playerId, answer, points));

    return { points, answer };
  }

  private addPointsToPlayer(playerId: PlayerId, points: number): void {
    if (this.player1Id.equals(playerId)) {
      this.player1Score = this.player1Score.add(points);
    } else if (this.player2Id?.equals(playerId)) {
      this.player2Score = this.player2Score.add(points);
    }
  }

  areAllPlayersAnswered(): boolean {
    const expectedPlayers = this.player2Id ? 2 : 1;
    return this.playersAnswered.size >= expectedPlayers;
  }

  completeQuestion(question: Question): void {
    if (this.status !== GameStatus.ACTIVE) {
      throw new GameNotStartedError(this.id.getValue());
    }

    const playerScores = new Map<string, number>();
    playerScores.set(this.player1Id.getValue(), this.player1Score.getValue());
    if (this.player2Id) {
      playerScores.set(this.player2Id.getValue(), this.player2Score.getValue());
    }

    this.addDomainEvent(new QuestionCompletedEvent(
      this.id,
      question,
      question.getCorrectAnswerIndex().getValue(),
      playerScores
    ));

    this.currentQuestionIndex++;
  }

  canComplete(): boolean {
    return this.status === GameStatus.ACTIVE && this.currentQuestionIndex >= 5;
  }

  complete(): void {
    if (!this.canComplete()) {
      throw new InvalidGameStateTransitionError(this.status, GameStatus.COMPLETED);
    }

    this.status = GameStatus.COMPLETED;
    this.completedAt = new Date();
    this.winnerId = this.determineWinner();

    const finalScores = new Map<string, number>();
    finalScores.set(this.player1Id.getValue(), this.player1Score.getValue());
    if (this.player2Id) {
      finalScores.set(this.player2Id.getValue(), this.player2Score.getValue());
    }

    this.addDomainEvent(new GameCompletedEvent(this.id, this, this.winnerId, finalScores));
  }

  private determineWinner(): PlayerId | undefined {
    if (!this.player2Id) {
      return this.player1Id; // Single player wins by default
    }

    if (this.player1Score.isGreaterThan(this.player2Score)) {
      return this.player1Id;
    } else if (this.player2Score.isGreaterThan(this.player1Score)) {
      return this.player2Id;
    }
    
    return undefined; // Tie
  }

  cancel(reason: string): void {
    if (this.status === GameStatus.COMPLETED) {
      throw new GameAlreadyCompletedError(this.id.getValue());
    }

    this.status = GameStatus.CANCELLED;
    this.completedAt = new Date();
    this.addDomainEvent(new GameCancelledEvent(this.id, reason));
  }

  isPlayerInGame(playerId: PlayerId): boolean {
    return this.player1Id.equals(playerId) || 
           (this.player2Id?.equals(playerId) ?? false);
  }

  isFull(): boolean {
    return this.player2Id !== undefined;
  }

  isWaiting(): boolean {
    return this.status === GameStatus.WAITING;
  }

  isActive(): boolean {
    return this.status === GameStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this.status === GameStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.status === GameStatus.CANCELLED;
  }

  // Domain Events management
  addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): readonly DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  // Conversion methods for persistence
  toPrimitives(): {
    id: string;
    player1Id: string;
    player2Id?: string;
    themeId: string;
    status: GameStatus;
    winnerId?: string;
    player1Score: number;
    player2Score: number;
    currentQuestionIndex: number;
    createdAt: Date;
    completedAt?: Date;
  } {
    return {
      id: this.id.getValue(),
      player1Id: this.player1Id.getValue(),
      player2Id: this.player2Id?.getValue(),
      themeId: this.themeId,
      status: this.status,
      winnerId: this.winnerId?.getValue(),
      player1Score: this.player1Score.getValue(),
      player2Score: this.player2Score.getValue(),
      currentQuestionIndex: this.currentQuestionIndex,
      createdAt: this.createdAt,
      completedAt: this.completedAt
    };
  }
}