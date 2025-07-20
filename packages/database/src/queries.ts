import { eq, and, desc, lt, isNotNull } from 'drizzle-orm';
import { db } from './connection';
import { themes, questions, games, answers } from './schema';

// Theme queries
export async function getActiveThemes() {
  return await db.select().from(themes).where(eq(themes.isActive, true));
}

export async function getThemeById(id: string) {
  const result = await db.select().from(themes).where(eq(themes.id, id));
  return result[0] || null;
}

// Question queries
export async function getRandomQuestionsByTheme(themeId: string, limit: number = 5) {
  return await db
    .select()
    .from(questions)
    .where(eq(questions.themeId, themeId))
    .orderBy(desc(questions.createdAt))
    .limit(limit);
}

export async function getQuestionById(id: string) {
  const result = await db.select().from(questions).where(eq(questions.id, id));
  return result[0] || null;
}

// Game queries
export async function createGame(data: {
  id: string;
  player1Id: string;
  themeId: string;
}) {
  const result = await db.insert(games).values(data).returning();
  return result[0];
}

export async function getGameById(id: string) {
  const result = await db.select().from(games).where(eq(games.id, id));
  return result[0] || null;
}

export async function updateGame(id: string, data: Partial<typeof games.$inferInsert>) {
  const result = await db.update(games).set(data).where(eq(games.id, id)).returning();
  return result[0] || null;
}

export async function findWaitingGameByTheme(themeId: string) {
  const result = await db
    .select()
    .from(games)
    .where(and(eq(games.themeId, themeId), eq(games.status, 'waiting')))
    .orderBy(desc(games.createdAt))
    .limit(1);
  return result[0] || null;
}

// Answer queries
export async function createAnswer(data: typeof answers.$inferInsert) {
  const result = await db.insert(answers).values(data).returning();
  return result[0];
}

export async function getAnswersByGame(gameId: string) {
  return await db.select().from(answers).where(eq(answers.gameId, gameId));
}

export async function getPlayerAnswersForGame(gameId: string, playerId: string) {
  return await db
    .select()
    .from(answers)
    .where(and(eq(answers.gameId, gameId), eq(answers.playerId, playerId)));
}

// Cleanup functions
export async function deleteGameAndAnswers(gameId: string) {
  // Delete all answers for the game first (due to foreign key constraints)
  await db.delete(answers).where(eq(answers.gameId, gameId));
  
  // Then delete the game
  const result = await db.delete(games).where(eq(games.id, gameId)).returning();
  return result[0] || null;
}

export async function deleteAnswersForGame(gameId: string) {
  const result = await db.delete(answers).where(eq(answers.gameId, gameId)).returning();
  return result;
}

export async function cleanupCompletedGames(olderThanMinutes: number = 60) {
  const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  
  // Get completed games older than cutoff time
  const completedGames = await db
    .select({ id: games.id })
    .from(games)
    .where(and(
      eq(games.status, 'completed'),
      and(
        isNotNull(games.completedAt),
        lt(games.completedAt, cutoffTime)
      )
    ));
  
  let deletedCount = 0;
  for (const game of completedGames) {
    try {
      await deleteGameAndAnswers(game.id);
      deletedCount++;
    } catch (error) {
      console.error(`Failed to cleanup game ${game.id}:`, error);
    }
  }
  
  return deletedCount;
}

export async function cleanupOldGames(olderThanHours: number = 24) {
  const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
  
  // Get all games (regardless of status) older than cutoff time
  const oldGames = await db
    .select({ id: games.id })
    .from(games)
    .where(lt(games.createdAt, cutoffTime));
  
  let deletedCount = 0;
  for (const game of oldGames) {
    try {
      await deleteGameAndAnswers(game.id);
      deletedCount++;
    } catch (error) {
      console.error(`Failed to cleanup old game ${game.id}:`, error);
    }
  }
  
  return deletedCount;
}