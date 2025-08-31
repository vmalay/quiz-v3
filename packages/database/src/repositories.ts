import { eq, and, desc } from 'drizzle-orm';
import { db } from './connection';
import { themes, questions, games, answers } from './schema';
import {
  Game,
  Question,
  Answer,
  Theme,
  GameRepository,
  QuestionRepository,
  AnswerRepository,
  ThemeRepository,
  GameStatus
} from '@quiz-battle/shared';

export class DatabaseGameRepository implements GameRepository {
  async createGame(data: { id: string; player1Id: string; themeId: string }): Promise<Game> {
    const result = await db.insert(games).values({
      ...data,
      status: 'waiting',
      player1Score: 0,
      player2Score: 0,
      currentQuestionIndex: 0,
      createdAt: new Date(),
    }).returning();
    return result[0] as Game;
  }

  async getGameById(id: string): Promise<Game | null> {
    const result = await db.select().from(games).where(eq(games.id, id));
    return result[0] as Game || null;
  }

  async updateGame(id: string, data: Partial<Game>): Promise<Game | null> {
    const result = await db.update(games).set(data).where(eq(games.id, id)).returning();
    return result[0] as Game || null;
  }

  async findWaitingGameByTheme(themeId: string): Promise<Game | null> {
    const result = await db
      .select()
      .from(games)
      .where(and(eq(games.themeId, themeId), eq(games.status, 'waiting')))
      .orderBy(desc(games.createdAt))
      .limit(1);
    return result[0] as Game || null;
  }

  async deleteGame(id: string): Promise<void> {
    await db.delete(games).where(eq(games.id, id));
  }
}

export class DatabaseQuestionRepository implements QuestionRepository {
  async getRandomQuestionsByTheme(themeId: string, limit: number): Promise<Question[]> {
    const result = await db
      .select()
      .from(questions)
      .where(eq(questions.themeId, themeId))
      .orderBy(desc(questions.createdAt))
      .limit(limit);
    return result as Question[];
  }

  async getQuestionById(id: string): Promise<Question | null> {
    const result = await db.select().from(questions).where(eq(questions.id, id));
    return result[0] as Question || null;
  }
}

export class DatabaseAnswerRepository implements AnswerRepository {
  async createAnswer(data: Answer): Promise<Answer> {
    const result = await db.insert(answers).values(data).returning();
    return result[0] as Answer;
  }

  async getAnswersByGame(gameId: string): Promise<Answer[]> {
    const result = await db.select().from(answers).where(eq(answers.gameId, gameId));
    return result as Answer[];
  }

  async getPlayerAnswersForGame(gameId: string, playerId: string): Promise<Answer[]> {
    const result = await db
      .select()
      .from(answers)
      .where(and(eq(answers.gameId, gameId), eq(answers.playerId, playerId)));
    return result as Answer[];
  }

  async deleteAnswersByGame(gameId: string): Promise<void> {
    await db.delete(answers).where(eq(answers.gameId, gameId));
  }
}

export class DatabaseThemeRepository implements ThemeRepository {
  async getActiveThemes(): Promise<Theme[]> {
    const result = await db.select().from(themes).where(eq(themes.isActive, true));
    return result as Theme[];
  }

  async getThemeById(id: string): Promise<Theme | null> {
    const result = await db.select().from(themes).where(eq(themes.id, id));
    return result[0] as Theme || null;
  }
}