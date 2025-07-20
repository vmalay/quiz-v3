import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import { 
  getActiveThemes, 
  getThemeById, 
  getRandomQuestionsByTheme,
  createGame,
  getGameById,
  updateGame,
  findWaitingGameByTheme,
  createAnswer,
  getAnswersByGame 
} from '@quiz-battle/database';
import { ThemeSchema, GameSchema, generateGameId } from '@quiz-battle/shared';

const t = initTRPC.create();

export const router = t.router;
export const procedure = t.procedure;

export const appRouter = router({
  // Theme routes
  themes: router({
    getAll: procedure.query(async () => {
      return await getActiveThemes();
    }),
    
    getById: procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await getThemeById(input.id);
      }),
  }),

  // Game routes
  games: router({
    create: procedure
      .input(z.object({
        playerId: z.string(),
        themeId: z.string(),
      }))
      .mutation(async ({ input }) => {
        const gameId = generateGameId();
        return await createGame({
          id: gameId,
          player1Id: input.playerId,
          themeId: input.themeId,
        });
      }),

    getById: procedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        return await getGameById(input.id);
      }),

    findWaiting: procedure
      .input(z.object({ themeId: z.string() }))
      .query(async ({ input }) => {
        return await findWaitingGameByTheme(input.themeId);
      }),

    update: procedure
      .input(z.object({
        id: z.string(),
        data: z.object({
          player2Id: z.string().optional(),
          status: z.string().optional(),
          winnerId: z.string().optional(),
          player1Score: z.number().optional(),
          player2Score: z.number().optional(),
          currentQuestionIndex: z.number().optional(),
          completedAt: z.date().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await updateGame(input.id, input.data);
      }),
  }),

  // Question routes
  questions: router({
    getByTheme: procedure
      .input(z.object({ 
        themeId: z.string(),
        limit: z.number().optional().default(5),
      }))
      .query(async ({ input }) => {
        return await getRandomQuestionsByTheme(input.themeId, input.limit);
      }),
  }),

  // Answer routes
  answers: router({
    create: procedure
      .input(z.object({
        gameId: z.string(),
        playerId: z.string(),
        questionId: z.string(),
        selectedAnswer: z.number().min(0).max(3),
        responseTimeMs: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await createAnswer({
          id: `answer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          gameId: input.gameId,
          playerId: input.playerId,
          questionId: input.questionId,
          selectedAnswer: input.selectedAnswer,
          isCorrect: false, // Will be calculated by server
          responseTimeMs: input.responseTimeMs,
          answeredAt: new Date(),
        });
      }),

    getByGame: procedure
      .input(z.object({ gameId: z.string() }))
      .query(async ({ input }) => {
        return await getAnswersByGame(input.gameId);
      }),
  }),
});

export type AppRouter = typeof appRouter;