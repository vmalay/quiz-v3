import { eq, and, desc } from 'drizzle-orm';
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