import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import {
  ThemeSchema,
  GameSchema,
  generateGameId,
  GameRepository,
  QuestionRepository,
  AnswerRepository,
  ThemeRepository,
  calculatePoints
} from '@quiz-battle/shared';

const t = initTRPC.create();

export const router = t.router;
export const procedure = t.procedure;

export function createAppRouter(
  gameRepository: GameRepository,
  questionRepository: QuestionRepository,
  answerRepository: AnswerRepository,
  themeRepository: ThemeRepository
) {
  return router({
    // Theme routes
    themes: router({
      getAll: procedure.query(async () => {
        return await themeRepository.getActiveThemes();
      }),

      getById: procedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
          return await themeRepository.getThemeById(input.id);
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
          return await gameRepository.createGame({
            id: gameId,
            player1Id: input.playerId,
            themeId: input.themeId,
          });
        }),

      getById: procedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
          return await gameRepository.getGameById(input.id);
        }),

      findWaiting: procedure
        .input(z.object({ themeId: z.string() }))
        .query(async ({ input }) => {
          return await gameRepository.findWaitingGameByTheme(input.themeId);
        }),

      update: procedure
        .input(z.object({
          id: z.string(),
          data: z.object({
            player2Id: z.string().optional(),
            status: z.enum(['waiting', 'active', 'completed', 'cancelled']).optional(),
            winnerId: z.string().optional(),
            player1Score: z.number().optional(),
            player2Score: z.number().optional(),
            currentQuestionIndex: z.number().optional(),
            completedAt: z.date().optional(),
          }),
        }))
        .mutation(async ({ input }) => {
          return await gameRepository.updateGame(input.id, input.data);
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
          return await questionRepository.getRandomQuestionsByTheme(input.themeId, input.limit);
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
          // Get the question to determine if answer is correct
          const question = await questionRepository.getQuestionById(input.questionId);
          const isCorrect = question ? input.selectedAnswer === question.correctAnswer : false;
          
          return await answerRepository.createAnswer({
            id: crypto.randomUUID(),
            gameId: input.gameId,
            playerId: input.playerId,
            questionId: input.questionId,
            selectedAnswer: input.selectedAnswer,
            isCorrect,
            responseTimeMs: input.responseTimeMs,
            answeredAt: new Date(),
          });
        }),

      getByGame: procedure
        .input(z.object({ gameId: z.string() }))
        .query(async ({ input }) => {
          return await answerRepository.getAnswersByGame(input.gameId);
        }),
    }),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
