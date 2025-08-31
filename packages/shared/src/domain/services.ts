// Domain Services - Encapsulate business logic that doesn't naturally fit within entities

import { GameId, PlayerId, AnswerIndex, ResponseTime } from './value-objects';
import { Game } from './aggregates';
import { Question, Theme, GameStatus, QuestionDifficulty } from './entities';
import { 
  GameRepository, 
  QuestionRepository, 
  ThemeRepository,
  AnswerRepository 
} from '../repositories';
import {
  InsufficientQuestionsError,
  ThemeNotFoundError,
  ThemeNotActiveError,
  GameFullError
} from './exceptions';

// Matchmaking Domain Service
export class MatchmakingService {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly themeRepository: ThemeRepository
  ) {}

  async findOrCreateGame(playerId: PlayerId, themeId: string): Promise<Game> {
    // Validate theme exists and is active
    const theme = await this.themeRepository.getThemeById(themeId);
    if (!theme) {
      throw new ThemeNotFoundError(themeId);
    }
    if (!theme.isThemeActive()) {
      throw new ThemeNotActiveError(themeId);
    }

    // Look for existing waiting game
    const waitingGame = await this.gameRepository.findWaitingGameByTheme(themeId);
    
    if (waitingGame && waitingGame.canPlayerJoin(playerId)) {
      // Join existing game
      waitingGame.addPlayer2(playerId);
      return waitingGame;
    }

    // Create new game
    return Game.create(playerId, themeId);
  }

  async canStartGame(gameId: GameId): Promise<boolean> {
    const game = await this.gameRepository.getGameById(gameId.getValue());
    return game?.canStart() ?? false;
  }
}

// Game Orchestration Service
export class GameOrchestrationService {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly questionRepository: QuestionRepository,
    private readonly answerRepository: AnswerRepository
  ) {}

  async startGame(gameId: GameId): Promise<{ game: Game; questions: Question[] }> {
    const game = await this.gameRepository.getGameById(gameId.getValue());
    if (!game) {
      throw new Error(`Game ${gameId.getValue()} not found`);
    }

    if (!game.canStart()) {
      throw new Error(`Game ${gameId.getValue()} cannot be started`);
    }

    // Get questions for the game
    const questions = await this.questionRepository.getRandomQuestionsByTheme(
      game.getThemeId(), 
      5
    );

    if (questions.length < 5) {
      throw new InsufficientQuestionsError(game.getThemeId(), 5, questions.length);
    }

    // Start the game
    game.start(questions);

    return { game, questions };
  }

  async submitAnswer(
    gameId: GameId,
    playerId: PlayerId,
    selectedAnswerIndex: number,
    responseTimeMs: number
  ): Promise<{ points: number; isCorrect: boolean }> {
    const game = await this.gameRepository.getGameById(gameId.getValue());
    if (!game) {
      throw new Error(`Game ${gameId.getValue()} not found`);
    }

    // Get current question
    const questions = await this.questionRepository.getRandomQuestionsByTheme(
      game.getThemeId(), 
      5
    );
    const currentQuestion = questions[game.getCurrentQuestionIndex()];
    if (!currentQuestion) {
      throw new Error('Current question not found');
    }

    // Create domain objects
    const answerIndex = AnswerIndex.create(selectedAnswerIndex);
    const responseTime = ResponseTime.create(responseTimeMs);

    // Submit answer through domain
    const result = game.submitAnswer(playerId, currentQuestion, answerIndex, responseTime);

    // Persist the answer
    await this.answerRepository.createAnswer({
      id: result.answer.getId(),
      gameId: gameId.getValue(),
      playerId: playerId.getValue(),
      questionId: currentQuestion.getId(),
      selectedAnswer: selectedAnswerIndex,
      isCorrect: result.answer.isAnswerCorrect(),
      responseTimeMs,
      answeredAt: result.answer.getAnsweredAt()
    });

    return {
      points: result.points,
      isCorrect: result.answer.isAnswerCorrect()
    };
  }

  async endQuestion(gameId: GameId): Promise<Game> {
    const game = await this.gameRepository.getGameById(gameId.getValue());
    if (!game) {
      throw new Error(`Game ${gameId.getValue()} not found`);
    }

    const questions = await this.questionRepository.getRandomQuestionsByTheme(
      game.getThemeId(), 
      5
    );
    const currentQuestion = questions[game.getCurrentQuestionIndex()];
    
    if (currentQuestion) {
      game.completeQuestion(currentQuestion);
    }

    return game;
  }

  async completeGame(gameId: GameId): Promise<Game> {
    const game = await this.gameRepository.getGameById(gameId.getValue());
    if (!game) {
      throw new Error(`Game ${gameId.getValue()} not found`);
    }

    if (game.canComplete()) {
      game.complete();
    }

    return game;
  }
}

// Scoring Domain Service
export class ScoringService {
  calculateQuestionPoints(
    responseTimeMs: number, 
    difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM
  ): number {
    const MAX_POINTS = 1000;
    const TIME_LIMIT_MS = 10000;
    const TIME_BONUS_MULTIPLIER = 0.8;

    if (responseTimeMs >= TIME_LIMIT_MS) {
      return 0;
    }

    const remainingTimeMs = TIME_LIMIT_MS - responseTimeMs;
    const timeBonus = Math.round(remainingTimeMs * TIME_BONUS_MULTIPLIER);
    const basePoints = MAX_POINTS - timeBonus;
    const points = Math.max(basePoints + timeBonus, 0);

    // Difficulty multiplier
    const difficultyMultiplier = difficulty === QuestionDifficulty.HARD ? 1.5 :
                                difficulty === QuestionDifficulty.MEDIUM ? 1.2 : 1.0;

    return Math.round(points * difficultyMultiplier);
  }

  calculateAccuracy(correctAnswers: number, totalQuestions: number): number {
    if (totalQuestions === 0) return 0;
    return Math.round((correctAnswers / totalQuestions) * 100);
  }

  calculateAverageResponseTime(responseTimes: number[]): number {
    if (responseTimes.length === 0) return 0;
    const sum = responseTimes.reduce((acc, time) => acc + time, 0);
    return Math.round(sum / responseTimes.length);
  }
}

// Question Selection Service
export class QuestionSelectionService {
  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly scoringService: ScoringService
  ) {}

  async selectQuestionsForGame(
    themeId: string, 
    requiredCount: number = 5,
    preferredDifficulty?: QuestionDifficulty
  ): Promise<Question[]> {
    // Get all available questions for theme
    const availableQuestions = await this.questionRepository.getRandomQuestionsByTheme(
      themeId, 
      requiredCount * 2 // Get more than needed for better selection
    );

    if (availableQuestions.length < requiredCount) {
      throw new InsufficientQuestionsError(themeId, requiredCount, availableQuestions.length);
    }

    // If preferred difficulty specified, prioritize those questions
    if (preferredDifficulty) {
      const preferredQuestions = availableQuestions.filter(
        q => q.getDifficulty() === preferredDifficulty
      );
      const otherQuestions = availableQuestions.filter(
        q => q.getDifficulty() !== preferredDifficulty
      );

      // Try to get at least 60% of preferred difficulty
      const preferredCount = Math.min(
        Math.ceil(requiredCount * 0.6), 
        preferredQuestions.length
      );
      const remainingCount = requiredCount - preferredCount;

      return [
        ...this.shuffleArray(preferredQuestions).slice(0, preferredCount),
        ...this.shuffleArray(otherQuestions).slice(0, remainingCount)
      ];
    }

    // Random selection with balanced difficulty
    return this.selectBalancedQuestions(availableQuestions, requiredCount);
  }

  private selectBalancedQuestions(questions: Question[], count: number): Question[] {
    // Group by difficulty
    const easyQuestions = questions.filter(q => q.getDifficulty() === QuestionDifficulty.EASY);
    const mediumQuestions = questions.filter(q => q.getDifficulty() === QuestionDifficulty.MEDIUM);
    const hardQuestions = questions.filter(q => q.getDifficulty() === QuestionDifficulty.HARD);

    // Aim for 20% easy, 60% medium, 20% hard
    const easyCount = Math.round(count * 0.2);
    const hardCount = Math.round(count * 0.2);
    const mediumCount = count - easyCount - hardCount;

    const selected: Question[] = [];
    
    selected.push(...this.shuffleArray(easyQuestions).slice(0, easyCount));
    selected.push(...this.shuffleArray(mediumQuestions).slice(0, mediumCount));
    selected.push(...this.shuffleArray(hardQuestions).slice(0, hardCount));

    // If we don't have enough of specific difficulties, fill with any available
    if (selected.length < count) {
      const remaining = questions.filter(q => !selected.includes(q));
      selected.push(...this.shuffleArray(remaining).slice(0, count - selected.length));
    }

    return this.shuffleArray(selected).slice(0, count);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

// Game Cleanup Service
export class GameCleanupService {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly answerRepository: AnswerRepository
  ) {}

  async cleanupCompletedGame(gameId: GameId): Promise<void> {
    // Delete all answers first (referential integrity)
    await this.answerRepository.deleteAnswersByGame(gameId.getValue());
    
    // Then delete the game
    await this.gameRepository.deleteGame(gameId.getValue());
  }

  async cleanupAbandonedGames(maxAgeHours: number = 24): Promise<number> {
    // This would typically be implemented with a proper query
    // For now, this is a placeholder for the interface
    
    // Implementation would:
    // 1. Find games in WAITING status older than maxAgeHours
    // 2. Find games in ACTIVE status with no recent activity
    // 3. Cancel and cleanup those games
    
    return 0; // Return count of cleaned up games
  }
}