import { PlayerId, GameId, Score, ResponseTime, AnswerIndex, QuestionText, QuestionOptions } from './value-objects';
import { DomainEvent } from './events';

// Domain Entities - Objects with identity and behavior

export enum GameStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum QuestionDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export class Question {
  constructor(
    private readonly id: string,
    private readonly themeId: string,
    private readonly text: QuestionText,
    private readonly options: QuestionOptions,
    private readonly correctAnswerIndex: AnswerIndex,
    private readonly difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM
  ) {}

  getId(): string {
    return this.id;
  }

  getThemeId(): string {
    return this.themeId;
  }

  getText(): QuestionText {
    return this.text;
  }

  getOptions(): QuestionOptions {
    return this.options;
  }

  getCorrectAnswerIndex(): AnswerIndex {
    return this.correctAnswerIndex;
  }

  getDifficulty(): QuestionDifficulty {
    return this.difficulty;
  }

  isCorrectAnswer(answerIndex: AnswerIndex): boolean {
    return this.correctAnswerIndex.equals(answerIndex);
  }

  getCorrectAnswerText(): string {
    return this.options.getOption(this.correctAnswerIndex);
  }

  // Business behavior
  calculatePoints(responseTime: ResponseTime): number {
    const MAX_POINTS = 1000;
    const TIME_LIMIT_MS = 10000;
    const TIME_BONUS_MULTIPLIER = 0.8;

    if (!responseTime.isWithinLimit(TIME_LIMIT_MS)) {
      return 0;
    }

    const remainingTimeMs = TIME_LIMIT_MS - responseTime.getMilliseconds();
    const timeBonus = Math.round(remainingTimeMs * TIME_BONUS_MULTIPLIER);
    const basePoints = MAX_POINTS - timeBonus;

    const points = Math.max(basePoints + timeBonus, 0);

    // Difficulty multiplier
    const difficultyMultiplier = this.difficulty === QuestionDifficulty.HARD ? 1.5 :
                                this.difficulty === QuestionDifficulty.MEDIUM ? 1.2 : 1.0;

    return Math.round(points * difficultyMultiplier);
  }
}

export class Answer {
  constructor(
    private readonly id: string,
    private readonly gameId: GameId,
    private readonly playerId: PlayerId,
    private readonly questionId: string,
    private readonly selectedAnswer: AnswerIndex,
    private readonly isCorrect: boolean,
    private readonly responseTime: ResponseTime,
    private readonly answeredAt: Date
  ) {}

  getId(): string {
    return this.id;
  }

  getGameId(): GameId {
    return this.gameId;
  }

  getPlayerId(): PlayerId {
    return this.playerId;
  }

  getQuestionId(): string {
    return this.questionId;
  }

  getSelectedAnswer(): AnswerIndex {
    return this.selectedAnswer;
  }

  isAnswerCorrect(): boolean {
    return this.isCorrect;
  }

  getResponseTime(): ResponseTime {
    return this.responseTime;
  }

  getAnsweredAt(): Date {
    return new Date(this.answeredAt);
  }

  static create(
    gameId: GameId,
    playerId: PlayerId,
    question: Question,
    selectedAnswer: AnswerIndex,
    responseTime: ResponseTime
  ): Answer {
    const isCorrect = question.isCorrectAnswer(selectedAnswer);
    
    return new Answer(
      crypto.randomUUID(),
      gameId,
      playerId,
      question.getId(),
      selectedAnswer,
      isCorrect,
      responseTime,
      new Date()
    );
  }
}

export class Player {
  constructor(
    private readonly id: PlayerId,
    private score: Score = Score.zero(),
    private readonly sessionId?: string,
    private isReady: boolean = false,
    private isConnected: boolean = true
  ) {}

  getId(): PlayerId {
    return this.id;
  }

  getScore(): Score {
    return this.score;
  }

  getSessionId(): string | undefined {
    return this.sessionId;
  }

  isPlayerReady(): boolean {
    return this.isReady;
  }

  isPlayerConnected(): boolean {
    return this.isConnected;
  }

  // Business behavior
  addPoints(points: number): void {
    this.score = this.score.add(points);
  }

  markAsReady(): void {
    this.isReady = true;
  }

  markAsDisconnected(): void {
    this.isConnected = false;
  }

  markAsConnected(): void {
    this.isConnected = true;
  }

  static create(sessionId?: string): Player {
    return new Player(PlayerId.generate(), Score.zero(), sessionId);
  }
}

export class Theme {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly description?: string,
    private readonly isActive: boolean = true,
    private readonly questionCount?: number
  ) {}

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  isThemeActive(): boolean {
    return this.isActive;
  }

  getQuestionCount(): number | undefined {
    return this.questionCount;
  }
}

// Game Session - represents the runtime state of a game
export class GameSession {
  private domainEvents: DomainEvent[] = [];
  private currentQuestionStartTime?: Date;
  private playersAnswered = new Set<string>();
  private questionTimer?: NodeJS.Timeout;
  private countdownInterval?: NodeJS.Timeout;

  constructor(
    private readonly game: any, // Will be Game from aggregates
    private readonly questions: Question[]
  ) {}

  getGame(): any {
    return this.game;
  }

  getQuestions(): readonly Question[] {
    return [...this.questions];
  }

  getCurrentQuestion(): Question | undefined {
    const index = this.game.getCurrentQuestionIndex();
    return this.questions[index];
  }

  getCurrentQuestionStartTime(): Date | undefined {
    return this.currentQuestionStartTime;
  }

  hasPlayerAnswered(playerId: PlayerId): boolean {
    return this.playersAnswered.has(playerId.getValue());
  }

  // Business behavior
  startQuestion(): void {
    this.currentQuestionStartTime = new Date();
    this.playersAnswered.clear();
  }

  recordPlayerAnswer(playerId: PlayerId): void {
    this.playersAnswered.add(playerId.getValue());
  }

  areAllPlayersAnswered(): boolean {
    const expectedPlayers = this.game.getPlayer2Id() ? 2 : 1;
    return this.playersAnswered.size >= expectedPlayers;
  }

  setQuestionTimer(timer: NodeJS.Timeout): void {
    this.questionTimer = timer;
  }

  setCountdownInterval(interval: NodeJS.Timeout): void {
    this.countdownInterval = interval;
  }

  clearTimers(): void {
    if (this.questionTimer) {
      clearTimeout(this.questionTimer);
      this.questionTimer = undefined;
    }
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
  }

  // Domain Events
  addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  getDomainEvents(): readonly DomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }
}