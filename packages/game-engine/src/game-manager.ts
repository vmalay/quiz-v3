import {
  Game,
  Question,
  GameStatus,
  GAME_CONFIG,
  calculatePoints,
  isValidAnswerIndex,
  ServerToClientEvents
} from '@quiz-battle/shared';
import {
  getGameById,
  updateGame,
  getRandomQuestionsByTheme,
  createAnswer,
  deleteGameAndAnswers,
} from '@quiz-battle/database';

export interface GameSession {
  game: Game;
  questions: Question[];
  currentQuestionStartTime: number;
  questionTimer?: NodeJS.Timeout;
  countdownInterval?: NodeJS.Timeout;
  playersAnswered: Set<string>;
  answers: Map<string, { answer: number; responseTime: number }>;
}

export class GameManager {
  private sessions = new Map<string, GameSession>();
  private socketEmitter: (gameId: string, event: keyof ServerToClientEvents, data: any) => void;

  constructor(socketEmitter: (gameId: string, event: keyof ServerToClientEvents, data: any) => void) {
    this.socketEmitter = socketEmitter;
  }

  async startGame(gameId: string): Promise<boolean> {
    try {
      const game = await getGameById(gameId);
      if (!game || !game.themeId || !game.player2Id) {
        return false;
      }

      // Get questions for the game
      const questionsFromDb = await getRandomQuestionsByTheme(game.themeId!, GAME_CONFIG.QUESTIONS_PER_GAME);
      if (questionsFromDb.length < GAME_CONFIG.QUESTIONS_PER_GAME) {
        return false;
      }

      // Transform questions to match our type
      const questions: Question[] = questionsFromDb.map(q => ({
        id: q.id,
        themeId: q.themeId,
        questionText: q.questionText,
        options: q.options as string[],
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
      }));

      // Update game status to active
      await updateGame(gameId, { status: GameStatus.ACTIVE });

      // Create game session
      const session: GameSession = {
        game: {
          ...game,
          status: GameStatus.ACTIVE,
          themeId: game.themeId!,
          player2Id: game.player2Id || undefined,
          winnerId: game.winnerId || undefined,
          completedAt: game.completedAt || undefined,
        },
        questions,
        currentQuestionStartTime: Date.now(),
        playersAnswered: new Set(),
        answers: new Map(),
      };

      this.sessions.set(gameId, session);

      // Emit game started event
      this.socketEmitter(gameId, 'game-started', {
        game: session.game,
        firstQuestion: questions[0],
        serverTime: Date.now(),
      });

      // Start first question
      this.startQuestion(gameId, 0);

      return true;
    } catch (error) {
      console.error('Error starting game:', error);
      return false;
    }
  }

  private startQuestion(gameId: string, questionIndex: number): void {
    const session = this.sessions.get(gameId);
    if (!session || questionIndex >= session.questions.length) {
      return;
    }

    const question = session.questions[questionIndex];
    session.currentQuestionStartTime = Date.now();
    session.playersAnswered.clear();
    session.answers.clear();

    // Emit question started event
    this.socketEmitter(gameId, 'question-started', {
      question,
      questionIndex,
      timeLimit: GAME_CONFIG.QUESTION_TIME_LIMIT_SECONDS * 1000,
      serverTime: session.currentQuestionStartTime,
    });

    // Start countdown ticks (every 100ms for smooth updates)
    session.countdownInterval = setInterval(() => {
      const elapsed = Date.now() - session.currentQuestionStartTime;
      const remaining = Math.max(0, (GAME_CONFIG.QUESTION_TIME_LIMIT_SECONDS * 1000) - elapsed);

      this.socketEmitter(gameId, 'countdown-tick', {
        timeRemaining: remaining,
        serverTime: Date.now(),
      });

      // Stop countdown when time runs out
      if (remaining <= 0) {
        if (session.countdownInterval) {
          clearInterval(session.countdownInterval);
          session.countdownInterval = undefined;
        }
      }
    }, 100); // Update every 100ms

    // Set question timer
    session.questionTimer = setTimeout(() => {
      this.endQuestion(gameId);
    }, GAME_CONFIG.QUESTION_TIME_LIMIT_SECONDS * 1000);
  }

  async submitAnswer(
    gameId: string,
    playerId: string,
    selectedAnswer: number
  ): Promise<boolean> {
    const session = this.sessions.get(gameId);
    if (!session) return false;

    if (session.playersAnswered.has(playerId) || !isValidAnswerIndex(selectedAnswer)) {
      return false;
    }

    const responseTime = Date.now() - session.currentQuestionStartTime;
    const currentQuestion = session.questions[session.game.currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    const points = isCorrect ? calculatePoints(responseTime) : 0;

    // Store answer
    session.answers.set(playerId, { answer: selectedAnswer, responseTime });
    session.playersAnswered.add(playerId);

    // Save to database
    await createAnswer({
      id: crypto.randomUUID(),
      gameId,
      playerId,
      questionId: currentQuestion.id,
      selectedAnswer,
      isCorrect,
      responseTimeMs: responseTime,
      answeredAt: new Date(),
    });

    // Update scores
    if (playerId === session.game.player1Id) {
      session.game.player1Score += points;
    } else if (playerId === session.game.player2Id) {
      session.game.player2Score += points;
    }

    // Update game in database
    await updateGame(gameId, {
      player1Score: session.game.player1Score,
      player2Score: session.game.player2Score,
    });

    // Emit opponent answered notification to the room
    this.socketEmitter(gameId, 'opponent-answered', {
      playerId,
      hasAnswered: true,
    });

    // Check if both players answered
    const playerCount = session.game.player2Id ? 2 : 1;
    if (session.playersAnswered.size >= playerCount) {
      this.endQuestion(gameId);
    }

    return true;
  }

  private async endQuestion(gameId: string): Promise<void> {
    const session = this.sessions.get(gameId);
    if (!session) return;

    // Clear timers
    if (session.questionTimer) {
      clearTimeout(session.questionTimer);
      session.questionTimer = undefined;
    }
    if (session.countdownInterval) {
      clearInterval(session.countdownInterval);
      session.countdownInterval = undefined;
    }

    const currentQuestion = session.questions[session.game.currentQuestionIndex];

    // Emit question timeout
    this.socketEmitter(gameId, 'question-timeout', {
      correctAnswer: currentQuestion.correctAnswer,
      scores: {
        player1: session.game.player1Score,
        player2: session.game.player2Score,
      },
    });

    // Move to next question or end game
    session.game.currentQuestionIndex += 1;

    if (session.game.currentQuestionIndex >= GAME_CONFIG.QUESTIONS_PER_GAME) {
      await this.endGame(gameId);
    } else {
      // Start next question after a short delay
      setTimeout(() => {
        this.startQuestion(gameId, session.game.currentQuestionIndex);
      }, 2000); // 2 second delay between questions
    }
  }

  private async endGame(gameId: string): Promise<void> {
    const session = this.sessions.get(gameId);
    if (!session) return;

    // Determine winner
    let winnerId: string | null = null;
    if (session.game.player1Score > session.game.player2Score) {
      winnerId = session.game.player1Id;
    } else if (session.game.player2Score > session.game.player1Score) {
      winnerId = session.game.player2Id || null;
    }

    // Update game in database
    await updateGame(gameId, {
      status: GameStatus.COMPLETED,
      winnerId,
      player1Score: session.game.player1Score,
      player2Score: session.game.player2Score,
      completedAt: new Date(),
    });

    // Emit game completed
    this.socketEmitter(gameId, 'game-completed', {
      game: session.game,
      finalScores: {
        player1: session.game.player1Score,
        player2: session.game.player2Score,
      },
      winner: winnerId,
    });

    // Clean up session
    this.sessions.delete(gameId);

    // Schedule database cleanup after a delay to allow clients to process results
    await deleteGameAndAnswers(gameId);
  }

  getSession(gameId: string): GameSession | undefined {
    return this.sessions.get(gameId);
  }

  async syncGameState(gameId: string, playerId: string): Promise<void> {
    const session = this.sessions.get(gameId);
    if (!session) return;

    const currentQuestion = session.questions[session.game.currentQuestionIndex];
    const timeElapsed = Date.now() - session.currentQuestionStartTime;
    const timeRemaining = Math.max(0, (GAME_CONFIG.QUESTION_TIME_LIMIT_SECONDS * 1000) - timeElapsed);

    this.socketEmitter(gameId, 'game-state-sync', {
      game: session.game,
      currentQuestion,
      timeRemaining,
    });
  }
}
