// Repository interfaces - Clean separation from domain and infrastructure

import { Game as DomainGame } from './domain/aggregates';
import { Question as DomainQuestion, Answer as DomainAnswer, Theme as DomainTheme } from './domain/entities';

// Repository interfaces for the domain layer
export interface GameRepository {
  createGame(data: { id: string; player1Id: string; themeId: string }): Promise<DomainGame>;
  getGameById(id: string): Promise<DomainGame | null>;
  updateGame(id: string, data: Partial<any>): Promise<DomainGame | null>;
  findWaitingGameByTheme(themeId: string): Promise<DomainGame | null>;
  deleteGame(id: string): Promise<void>;
  save(game: DomainGame): Promise<void>;
}

export interface QuestionRepository {
  getRandomQuestionsByTheme(themeId: string, limit: number): Promise<DomainQuestion[]>;
  getQuestionById(id: string): Promise<DomainQuestion | null>;
  getQuestionsByIds(ids: string[]): Promise<DomainQuestion[]>;
}

export interface AnswerRepository {
  createAnswer(data: {
    id: string;
    gameId: string;
    playerId: string;
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    responseTimeMs: number;
    answeredAt: Date;
  }): Promise<DomainAnswer>;
  getAnswersByGame(gameId: string): Promise<DomainAnswer[]>;
  getPlayerAnswersForGame(gameId: string, playerId: string): Promise<DomainAnswer[]>;
  deleteAnswersByGame(gameId: string): Promise<void>;
}

export interface ThemeRepository {
  getActiveThemes(): Promise<DomainTheme[]>;
  getThemeById(id: string): Promise<DomainTheme | null>;
}

// Unit of Work pattern for transactional operations
export interface UnitOfWork {
  games: GameRepository;
  questions: QuestionRepository;
  answers: AnswerRepository;
  themes: ThemeRepository;
  
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  dispose(): Promise<void>;
}