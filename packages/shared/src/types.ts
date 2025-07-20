import { z } from 'zod';

// Game Status
export const GameStatus = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type GameStatus = typeof GameStatus[keyof typeof GameStatus];

// Player
export const PlayerSchema = z.object({
  id: z.string(),
  sessionId: z.string().optional(),
  isReady: z.boolean().default(false),
  isConnected: z.boolean().default(true),
});

export type Player = z.infer<typeof PlayerSchema>;

// Theme
export const ThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  questionCount: z.number().optional(),
});

export type Theme = z.infer<typeof ThemeSchema>;

// Question
export const QuestionSchema = z.object({
  id: z.string(),
  themeId: z.string(),
  questionText: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.number().min(0).max(3),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
});

export type Question = z.infer<typeof QuestionSchema>;

// Answer
export const AnswerSchema = z.object({
  id: z.string(),
  gameId: z.string(),
  playerId: z.string(),
  questionId: z.string(),
  selectedAnswer: z.number().min(0).max(3).optional(),
  isCorrect: z.boolean().optional(),
  responseTimeMs: z.number().optional(),
  answeredAt: z.date(),
});

export type Answer = z.infer<typeof AnswerSchema>;

// Game
export const GameSchema = z.object({
  id: z.string(),
  player1Id: z.string(),
  player2Id: z.string().optional(),
  themeId: z.string(),
  status: z.nativeEnum(GameStatus),
  winnerId: z.string().optional(),
  player1Score: z.number().default(0),
  player2Score: z.number().default(0),
  currentQuestionIndex: z.number().default(0),
  questions: z.array(QuestionSchema).optional(),
  createdAt: z.date(),
  completedAt: z.date().optional(),
});

export type Game = z.infer<typeof GameSchema>;

// Socket Events
export interface ServerToClientEvents {
  'player-create-game': (data: { gameId: string; game: Game }) => void;
  'player-join-game': (data: { gameId: string; game: Game }) => void;
  'opponent-join-game': (data: { game: Game; opponent: Player }) => void;
  'game-started': (data: { game: Game; firstQuestion: Question; serverTime: number }) => void;
  'question-started': (data: { question: Question; questionIndex: number; timeLimit: number; serverTime: number }) => void;
  'question-timeout': (data: { correctAnswer: number; scores: { player1: number; player2: number } }) => void;
  'opponent-answered': (data: { playerId: string; hasAnswered: boolean }) => void;
  'game-completed': (data: { game: Game; finalScores: { player1: number; player2: number }; winner: string | null }) => void;
  'countdown-tick': (data: { timeRemaining: number; serverTime: number }) => void;
  'answer-result': (data: { isCorrect: boolean; points: number; correctAnswer: number }) => void;
  'game-state-sync': (data: { game: Game; currentQuestion?: Question; timeRemaining?: number }) => void;
  'error': (data: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
  'player-join-matchmaking': (data: { themeId: string; playerId: string }) => void;
  'player-submit-answer': (data: { gameId: string; playerId: string; selectedAnswer: number; responseTime: number }) => void;
  'request-game-state': (data: { gameId: string; playerId: string }) => void;
}

// Scoring
export const SCORING = {
  MAX_POINTS_PER_QUESTION: 1000,
  TIME_BONUS_MULTIPLIER: 0.8, // 80% of remaining time as bonus
  QUESTION_TIME_LIMIT: 10000, // 10 seconds in milliseconds
} as const;

// Game Configuration
export const GAME_CONFIG = {
  QUESTIONS_PER_GAME: 5,
  QUESTION_TIME_LIMIT_SECONDS: 10,
  MATCHMAKING_TIMEOUT_SECONDS: 30,
} as const;