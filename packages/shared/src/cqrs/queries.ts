// CQRS Queries - Read operations optimized for specific use cases

import { PlayerId, GameId } from '../domain/value-objects';
import { GameStatus, QuestionDifficulty } from '../domain/entities';

// Base query interface
export interface Query {
  readonly queryId: string;
  readonly timestamp: Date;
  readonly correlationId?: string;
  readonly userId?: string;
}

export abstract class BaseQuery implements Query {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor(
    public readonly correlationId?: string,
    public readonly userId?: string
  ) {
    this.queryId = crypto.randomUUID();
    this.timestamp = new Date();
  }
}

// Game Queries
export class GetGameStateQuery extends BaseQuery {
  constructor(
    public readonly gameId: GameId,
    correlationId?: string,
    userId?: string
  ) {
    super(correlationId, userId);
  }
}

export class GetPlayerStatsQuery extends BaseQuery {
  constructor(
    public readonly playerId: PlayerId,
    public readonly timeframe?: 'DAY' | 'WEEK' | 'MONTH' | 'ALL',
    correlationId?: string,
    userId?: string
  ) {
    super(correlationId, userId);
  }
}

export class GetGameHistoryQuery extends BaseQuery {
  constructor(
    public readonly playerId: PlayerId,
    public readonly limit: number = 10,
    public readonly offset: number = 0,
    correlationId?: string,
    userId?: string
  ) {
    super(correlationId, userId);
  }
}

export class GetLeaderboardQuery extends BaseQuery {
  constructor(
    public readonly themeId?: string,
    public readonly timeframe: 'DAY' | 'WEEK' | 'MONTH' | 'ALL' = 'ALL',
    public readonly limit: number = 100,
    correlationId?: string,
    userId?: string
  ) {
    super(correlationId, userId);
  }
}

export class GetActiveGamesQuery extends BaseQuery {
  constructor(
    public readonly themeId?: string,
    public readonly limit: number = 50,
    correlationId?: string,
    userId?: string
  ) {
    super(correlationId, userId);
  }
}

export class GetGameAnalyticsQuery extends BaseQuery {
  constructor(
    public readonly dateFrom: Date,
    public readonly dateTo: Date,
    public readonly groupBy: 'HOUR' | 'DAY' | 'WEEK' = 'DAY',
    correlationId?: string,
    userId?: string
  ) {
    super(correlationId, userId);
  }
}

// Read Models (Projections)
export interface GameStateView {
  gameId: string;
  status: GameStatus;
  player1: PlayerView;
  player2?: PlayerView;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemaining?: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  theme: ThemeView;
  currentQuestion?: QuestionView;
}

export interface PlayerView {
  id: string;
  score: number;
  isConnected: boolean;
  lastActivity: Date;
  responseStats: {
    averageTime: number;
    accuracy: number;
    answersCount: number;
  };
}

export interface ThemeView {
  id: string;
  name: string;
  description?: string;
  questionCount: number;
  difficulty: QuestionDifficulty;
}

export interface QuestionView {
  id: string;
  text: string;
  options: string[];
  difficulty: QuestionDifficulty;
  timeLimit: number;
}

export interface PlayerStatsView {
  playerId: string;
  totalGames: number;
  gamesWon: number;
  gamesLost: number;
  gamesTied: number;
  winRate: number;
  averageScore: number;
  bestScore: number;
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  averageResponseTime: number;
  fastestResponse: number;
  favoriteThemes: ThemeStatsView[];
  recentGames: GameSummaryView[];
  achievements: AchievementView[];
}

export interface ThemeStatsView {
  theme: ThemeView;
  gamesPlayed: number;
  winRate: number;
  averageScore: number;
  accuracy: number;
}

export interface GameSummaryView {
  gameId: string;
  theme: ThemeView;
  opponent?: PlayerView;
  playerScore: number;
  opponentScore: number;
  result: 'WON' | 'LOST' | 'TIED';
  duration: number;
  playedAt: Date;
}

export interface AchievementView {
  id: string;
  name: string;
  description: string;
  unlockedAt: Date;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

export interface LeaderboardView {
  entries: LeaderboardEntryView[];
  playerRank?: number;
  totalPlayers: number;
  updatedAt: Date;
}

export interface LeaderboardEntryView {
  rank: number;
  player: PlayerView;
  score: number;
  gamesPlayed: number;
  winRate: number;
}

export interface GameAnalyticsView {
  period: {
    from: Date;
    to: Date;
    groupBy: string;
  };
  metrics: {
    totalGames: number;
    activeUsers: number;
    averageGameDuration: number;
    completionRate: number;
    popularThemes: ThemePopularityView[];
    hourlyDistribution: HourlyStatsView[];
  };
}

export interface ThemePopularityView {
  theme: ThemeView;
  gamesPlayed: number;
  uniquePlayers: number;
  averageRating: number;
}

export interface HourlyStatsView {
  hour: number;
  gamesStarted: number;
  gamesCompleted: number;
  activeUsers: number;
}

// Query handler interface
export interface QueryHandler<TQuery extends Query, TResult> {
  handle(query: TQuery): Promise<TResult>;
  canHandle(query: Query): boolean;
}

// Query bus for dispatching
export interface QueryBus {
  send<TQuery extends Query, TResult>(query: TQuery): Promise<TResult>;
  register<TQuery extends Query, TResult>(
    queryType: string,
    handler: QueryHandler<TQuery, TResult>
  ): void;
}

// Query middleware
export interface QueryMiddleware {
  execute<TQuery extends Query, TResult>(
    query: TQuery,
    next: (query: TQuery) => Promise<TResult>
  ): Promise<TResult>;
}

export class CachingMiddleware implements QueryMiddleware {
  constructor(
    private cache: QueryCache,
    private ttlSeconds: number = 300
  ) {}

  async execute<TQuery extends Query, TResult>(
    query: TQuery,
    next: (query: TQuery) => Promise<TResult>
  ): Promise<TResult> {
    const cacheKey = this.generateCacheKey(query);
    const cached = await this.cache.get<TResult>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const result = await next(query);
    await this.cache.set(cacheKey, result, this.ttlSeconds);
    return result;
  }

  private generateCacheKey(query: Query): string {
    return `query:${query.constructor.name}:${JSON.stringify(query)}`;
  }
}

export class QueryLoggingMiddleware implements QueryMiddleware {
  async execute<TQuery extends Query, TResult>(
    query: TQuery,
    next: (query: TQuery) => Promise<TResult>
  ): Promise<TResult> {
    console.log(`Executing query: ${query.constructor.name}`, {
      queryId: query.queryId,
      timestamp: query.timestamp,
      correlationId: query.correlationId
    });

    const startTime = Date.now();
    try {
      const result = await next(query);
      const duration = Date.now() - startTime;
      
      console.log(`Query completed: ${query.constructor.name}`, {
        queryId: query.queryId,
        duration
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`Query failed: ${query.constructor.name}`, {
        queryId: query.queryId,
        error: error instanceof Error ? error.message : String(error),
        duration
      });
      throw error;
    }
  }
}

interface QueryCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(pattern?: string): Promise<void>;
}

// Materialized view management
export interface MaterializedView {
  name: string;
  refresh(): Promise<void>;
  getLastRefreshTime(): Promise<Date>;
  isStale(): Promise<boolean>;
}

export interface ViewProjector {
  project(events: any[]): Promise<void>;
  reset(): Promise<void>;
}

// Real-time query subscriptions
export interface QuerySubscription<TResult> {
  id: string;
  query: Query;
  onUpdate: (result: TResult) => void;
  onError: (error: Error) => void;
  stop(): Promise<void>;
}

export interface QuerySubscriptionManager {
  subscribe<TQuery extends Query, TResult>(
    query: TQuery,
    onUpdate: (result: TResult) => void,
    onError?: (error: Error) => void
  ): Promise<QuerySubscription<TResult>>;
  
  unsubscribe(subscriptionId: string): Promise<void>;
}