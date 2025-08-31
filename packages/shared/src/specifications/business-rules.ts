// Specification Pattern - Composable Business Rules

// Base specification interface
export interface Specification<T> {
  isSatisfiedBy(candidate: T): boolean;
  and(other: Specification<T>): Specification<T>;
  or(other: Specification<T>): Specification<T>;
  not(): Specification<T>;
}

// Abstract base class for specifications
export abstract class BaseSpecification<T> implements Specification<T> {
  abstract isSatisfiedBy(candidate: T): boolean;

  and(other: Specification<T>): Specification<T> {
    return new AndSpecification(this, other);
  }

  or(other: Specification<T>): Specification<T> {
    return new OrSpecification(this, other);
  }

  not(): Specification<T> {
    return new NotSpecification(this);
  }
}

// Composite specifications
export class AndSpecification<T> extends BaseSpecification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) && 
           this.right.isSatisfiedBy(candidate);
  }
}

export class OrSpecification<T> extends BaseSpecification<T> {
  constructor(
    private left: Specification<T>,
    private right: Specification<T>
  ) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return this.left.isSatisfiedBy(candidate) || 
           this.right.isSatisfiedBy(candidate);
  }
}

export class NotSpecification<T> extends BaseSpecification<T> {
  constructor(private spec: Specification<T>) {
    super();
  }

  isSatisfiedBy(candidate: T): boolean {
    return !this.spec.isSatisfiedBy(candidate);
  }
}

// Game-specific specifications
import { Game } from '../domain/aggregates';
import { GameStatus } from '../domain/entities';
import { PlayerId } from '../domain/value-objects';
import { Theme, Question } from '../domain/entities';

// Game specifications
export class GameCanStartSpecification extends BaseSpecification<Game> {
  isSatisfiedBy(game: Game): boolean {
    return game.getStatus() === GameStatus.WAITING &&
           game.getPlayer2Id() !== undefined;
  }
}

export class GameCanAcceptPlayerSpecification extends BaseSpecification<Game> {
  constructor(private playerId: PlayerId) {
    super();
  }

  isSatisfiedBy(game: Game): boolean {
    return game.getStatus() === GameStatus.WAITING &&
           !game.isFull() &&
           !game.isPlayerInGame(this.playerId);
  }
}

export class GameIsActiveSpecification extends BaseSpecification<Game> {
  isSatisfiedBy(game: Game): boolean {
    return game.getStatus() === GameStatus.ACTIVE;
  }
}

export class GameCanEndSpecification extends BaseSpecification<Game> {
  isSatisfiedBy(game: Game): boolean {
    return game.getStatus() === GameStatus.ACTIVE &&
           game.getCurrentQuestionIndex() >= 5; // QUESTIONS_PER_GAME
  }
}

export class PlayerCanAnswerSpecification extends BaseSpecification<{ game: Game; playerId: PlayerId }> {
  isSatisfiedBy(candidate: { game: Game; playerId: PlayerId }): boolean {
    const { game, playerId } = candidate;
    return game.getStatus() === GameStatus.ACTIVE &&
           game.isPlayerInGame(playerId);
  }
}

// Theme specifications
export class ThemeIsActiveSpecification extends BaseSpecification<Theme> {
  isSatisfiedBy(theme: Theme): boolean {
    return theme.isThemeActive();
  }
}

export class ThemeHasSufficientQuestionsSpecification extends BaseSpecification<{ theme: Theme; requiredCount: number }> {
  isSatisfiedBy(candidate: { theme: Theme; requiredCount: number }): boolean {
    const { theme, requiredCount } = candidate;
    const questionCount = theme.getQuestionCount();
    return questionCount !== undefined && questionCount >= requiredCount;
  }
}

// Question specifications
export class QuestionBelongsToThemeSpecification extends BaseSpecification<{ question: Question; themeId: string }> {
  isSatisfiedBy(candidate: { question: Question; themeId: string }): boolean {
    return candidate.question.getThemeId() === candidate.themeId;
  }
}

export class QuestionHasValidOptionsSpecification extends BaseSpecification<Question> {
  isSatisfiedBy(question: Question): boolean {
    const options = question.getOptions().getOptions();
    return options.length === 4 && 
           options.every(option => option.trim().length > 0);
  }
}

// Complex business rule specifications
export class ValidGameStartConditionsSpecification extends BaseSpecification<{
  game: Game;
  theme: Theme;
  questions: Question[];
}> {
  isSatisfiedBy(candidate: { game: Game; theme: Theme; questions: Question[] }): boolean {
    const { game, theme, questions } = candidate;

    // Compose multiple specifications
    const gameCanStart = new GameCanStartSpecification();
    const themeIsActive = new ThemeIsActiveSpecification();
    const hasSufficientQuestions = new ThemeHasSufficientQuestionsSpecification();

    return gameCanStart.isSatisfiedBy(game) &&
           themeIsActive.isSatisfiedBy(theme) &&
           hasSufficientQuestions.isSatisfiedBy({ theme, requiredCount: 5 }) &&
           questions.length >= 5 &&
           questions.every(q => new QuestionBelongsToThemeSpecification()
             .isSatisfiedBy({ question: q, themeId: theme.getId() }));
  }
}

export class ValidAnswerSubmissionSpecification extends BaseSpecification<{
  game: Game;
  playerId: PlayerId;
  questionIndex: number;
}> {
  isSatisfiedBy(candidate: { game: Game; playerId: PlayerId; questionIndex: number }): boolean {
    const { game, playerId, questionIndex } = candidate;

    const gameIsActive = new GameIsActiveSpecification();
    const playerCanAnswer = new PlayerCanAnswerSpecification();

    return gameIsActive.isSatisfiedBy(game) &&
           playerCanAnswer.isSatisfiedBy({ game, playerId }) &&
           questionIndex === game.getCurrentQuestionIndex();
  }
}

// Matchmaking specifications
export class PlayerEligibleForMatchmakingSpecification extends BaseSpecification<{
  playerId: PlayerId;
  themeId: string;
  activeGames: Game[];
}> {
  isSatisfiedBy(candidate: { playerId: PlayerId; themeId: string; activeGames: Game[] }): boolean {
    const { playerId, activeGames } = candidate;

    // Player should not be in any active game
    const isInActiveGame = activeGames.some(game => 
      game.isPlayerInGame(playerId) && 
      (game.getStatus() === GameStatus.WAITING || game.getStatus() === GameStatus.ACTIVE)
    );

    return !isInActiveGame;
  }
}

export class OptimalGameMatchSpecification extends BaseSpecification<{
  waitingGame: Game;
  playerId: PlayerId;
  playerSkillLevel?: number;
}> {
  isSatisfiedBy(candidate: { waitingGame: Game; playerId: PlayerId; playerSkillLevel?: number }): boolean {
    const { waitingGame, playerId, playerSkillLevel } = candidate;

    const gameCanAcceptPlayer = new GameCanAcceptPlayerSpecification(playerId);
    
    if (!gameCanAcceptPlayer.isSatisfiedBy(waitingGame)) {
      return false;
    }

    // Optional: skill-based matching
    if (playerSkillLevel !== undefined) {
      // Implement skill-based matching logic
      const timeSinceCreated = Date.now() - waitingGame.getCreatedAt().getTime();
      const maxWaitTime = 30000; // 30 seconds
      
      // As wait time increases, relax skill matching requirements
      const skillToleranceMultiplier = Math.min(timeSinceCreated / maxWaitTime, 2);
      const maxSkillDifference = 200 * skillToleranceMultiplier;
      
      // For now, accept any match (skill system not implemented)
      return true;
    }

    return true;
  }
}

// Performance specifications
export class GamePerformanceSpecification extends BaseSpecification<{
  responseTimeMs: number;
  playerCount: number;
  gameAgeMs: number;
}> {
  isSatisfiedBy(candidate: { responseTimeMs: number; playerCount: number; gameAgeMs: number }): boolean {
    const { responseTimeMs, playerCount, gameAgeMs } = candidate;

    // Response time should be reasonable
    const maxResponseTime = 10000; // 10 seconds
    if (responseTimeMs > maxResponseTime) return false;

    // Game shouldn't run too long
    const maxGameAge = 600000; // 10 minutes
    if (gameAgeMs > maxGameAge) return false;

    // Player count should be valid
    if (playerCount < 1 || playerCount > 2) return false;

    return true;
  }
}

// Security specifications
export class ValidPlayerActionSpecification extends BaseSpecification<{
  playerId: PlayerId;
  actionType: string;
  gameId: string;
  timestamp: Date;
}> {
  isSatisfiedBy(candidate: { playerId: PlayerId; actionType: string; gameId: string; timestamp: Date }): boolean {
    const { timestamp, actionType } = candidate;

    // Action should not be too old (prevent replay attacks)
    const maxAge = 30000; // 30 seconds
    const age = Date.now() - timestamp.getTime();
    if (age > maxAge) return false;

    // Validate action type
    const validActions = ['SUBMIT_ANSWER', 'JOIN_GAME', 'START_GAME', 'CANCEL_GAME'];
    if (!validActions.includes(actionType)) return false;

    return true;
  }
}

// Specification factory for common combinations
export class GameSpecificationFactory {
  static createGameStartValidation(): Specification<{ game: Game; theme: Theme; questions: Question[] }> {
    return new ValidGameStartConditionsSpecification();
  }

  static createAnswerValidation(): Specification<{ game: Game; playerId: PlayerId; questionIndex: number }> {
    return new ValidAnswerSubmissionSpecification();
  }

  static createMatchmakingValidation(): Specification<{ waitingGame: Game; playerId: PlayerId; playerSkillLevel?: number }> {
    return new OptimalGameMatchSpecification();
  }
}

// Specification evaluator for detailed feedback
export interface SpecificationResult {
  isValid: boolean;
  violations: SpecificationViolation[];
}

export interface SpecificationViolation {
  rule: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
}

export class SpecificationEvaluator {
  static evaluate<T>(spec: Specification<T>, candidate: T): SpecificationResult {
    // This would be enhanced to provide detailed violation information
    const isValid = spec.isSatisfiedBy(candidate);
    
    return {
      isValid,
      violations: isValid ? [] : [{
        rule: spec.constructor.name,
        message: 'Business rule violation',
        severity: 'ERROR'
      }]
    };
  }
}