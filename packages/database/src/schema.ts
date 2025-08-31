import { pgTable, text, timestamp, boolean, integer, jsonb, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const themes = pgTable('themes', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  themeId: uuid('theme_id').references(() => themes.id, { onDelete: 'cascade' }).notNull(),
  questionText: text('question_text').notNull(),
  options: jsonb('options').notNull(),
  correctAnswer: integer('correct_answer').notNull(),
  difficulty: text('difficulty').default('medium').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const GameStatus = {
    WAITING: 'waiting',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
}

export type GameStatusType = typeof GameStatus[keyof typeof GameStatus];

export const games = pgTable('games', {
  id: uuid('id').defaultRandom().primaryKey(),
  player1Id: uuid('player1_id').notNull(),
  player2Id: uuid('player2_id'),
  themeId: uuid('theme_id').references(() => themes.id),
  status: text('status').default('waiting').$type<GameStatusType>().notNull(),
  winnerId: uuid('winner_id'),
  player1Score: integer('player1_score').default(0).notNull(),
  player2Score: integer('player2_score').default(0).notNull(),
  currentQuestionIndex: integer('current_question_index').default(0).notNull(),
  questionDeadline: timestamp('question_deadline'),
  questionTimeLimit: integer('question_time_limit').default(10),
  totalQuestions: integer('total_questions').default(5),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

export const answers = pgTable('answers', {
  id: uuid('id').defaultRandom().primaryKey(),
  gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }).notNull(),
  playerId: uuid('player_id').notNull(), // Changed from text
  questionId: uuid('question_id').references(() => questions.id).notNull(),
  selectedAnswer: integer('selected_answer'),
  isCorrect: boolean('is_correct'),
  responseTimeMs: integer('response_time_ms'),
  answeredAt: timestamp('answered_at').defaultNow().notNull(),
});

export const themesRelations = relations(themes, ({ many }) => ({
  questions: many(questions),
  games: many(games),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  theme: one(themes, {
    fields: [questions.themeId],
    references: [themes.id],
  }),
  answers: many(answers),
}));

export const gamesRelations = relations(games, ({ one, many }) => ({
  theme: one(themes, {
    fields: [games.themeId],
    references: [themes.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  game: one(games, {
    fields: [answers.gameId],
    references: [games.id],
  }),
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
}));
