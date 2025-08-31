// Advanced Factory Pattern - Intelligent object creation with business logic

import { Game } from '../domain/aggregates';
import { Question, Theme, QuestionDifficulty, GameStatus } from '../domain/entities';
import { PlayerId, GameId, QuestionText, QuestionOptions, AnswerIndex } from '../domain/value-objects';
import { 
  GameCanStartSpecification, 
  ThemeIsActiveSpecification,
  ValidGameStartConditionsSpecification 
} from '../specifications/business-rules';
import { QuestionRepository, ThemeRepository } from '../repositories';

// Game Factory - Creates games with optimal configurations
export interface GameFactory {
  createStandardGame(player1Id: PlayerId, themeId: string): Promise<Game>;
  createPrivateGame(player1Id: PlayerId, player2Id: PlayerId, themeId: string): Promise<Game>;
  createTournamentGame(players: PlayerId[], themeId: string, tournamentConfig: TournamentConfig): Promise<Game>;
  createPracticeGame(playerId: PlayerId, themeId: string, difficulty: QuestionDifficulty): Promise<Game>;
}

export interface TournamentConfig {
  maxPlayers: number;
  timeLimit: number;
  difficultyProgression: boolean;
  eliminationRounds: number;
}

export class SmartGameFactory implements GameFactory {
  constructor(
    private readonly questionRepository: QuestionRepository,
    private readonly themeRepository: ThemeRepository,
    private readonly questionSelector: QuestionSelectionService,
    private readonly difficultyCalculator: DifficultyCalculationService
  ) {}

  async createStandardGame(player1Id: PlayerId, themeId: string): Promise<Game> {
    // Validate theme
    const theme = await this.validateTheme(themeId);
    
    // Create game with optimal settings
    const game = Game.create(player1Id, themeId);
    
    // Apply game creation policies
    await this.applyGameCreationPolicies(game, theme);
    
    return game;
  }

  async createPrivateGame(player1Id: PlayerId, player2Id: PlayerId, themeId: string): Promise<Game> {
    const theme = await this.validateTheme(themeId);
    
    const game = Game.create(player1Id, themeId);
    game.addPlayer2(player2Id);
    
    await this.applyGameCreationPolicies(game, theme);
    
    return game;
  }

  async createTournamentGame(
    players: PlayerId[], 
    themeId: string, 
    tournamentConfig: TournamentConfig
  ): Promise<Game> {
    if (players.length !== 2) {
      throw new Error('Tournament games currently support only 2 players');
    }

    const theme = await this.validateTheme(themeId);
    const game = await this.createPrivateGame(players[0], players[1], themeId);
    
    // Apply tournament-specific rules
    await this.applyTournamentPolicies(game, tournamentConfig);
    
    return game;
  }

  async createPracticeGame(
    playerId: PlayerId, 
    themeId: string, 
    difficulty: QuestionDifficulty
  ): Promise<Game> {
    const theme = await this.validateTheme(themeId);
    
    // Create single-player practice game
    const game = Game.create(playerId, themeId);
    
    // Select questions of specific difficulty
    const questions = await this.questionSelector.selectQuestionsByDifficulty(
      themeId, 
      difficulty, 
      5
    );
    
    return game;
  }

  private async validateTheme(themeId: string): Promise<Theme> {
    const theme = await this.themeRepository.getThemeById(themeId);
    if (!theme) {
      throw new Error(`Theme ${themeId} not found`);
    }

    const themeSpec = new ThemeIsActiveSpecification();
    if (!themeSpec.isSatisfiedBy(theme)) {
      throw new Error(`Theme ${themeId} is not active`);
    }

    return theme;
  }

  private async applyGameCreationPolicies(game: Game, theme: Theme): Promise<void> {
    // Apply business rules and policies during game creation
    // This could include setting up initial state, applying theme-specific rules, etc.
  }

  private async applyTournamentPolicies(game: Game, config: TournamentConfig): Promise<void> {
    // Apply tournament-specific configurations
    // This could modify game behavior for tournament play
  }
}

// Question Factory - Creates questions with validation and optimization
export interface QuestionFactory {
  createQuestion(
    themeId: string,
    text: string,
    options: string[],
    correctAnswerIndex: number,
    difficulty?: QuestionDifficulty
  ): Question;
  
  createQuestionFromTemplate(
    template: QuestionTemplate,
    variables: Record<string, string>
  ): Question;
  
  validateQuestion(question: Question): QuestionValidationResult;
}

export interface QuestionTemplate {
  id: string;
  themeId: string;
  textTemplate: string;
  optionTemplates: string[];
  correctAnswerIndex: number;
  difficulty: QuestionDifficulty;
  variables: TemplateVariable[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date';
  constraints?: any;
}

export interface QuestionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  qualityScore: number;
}

export class IntelligentQuestionFactory implements QuestionFactory {
  constructor(
    private readonly contentValidator: ContentValidator,
    private readonly difficultyAnalyzer: DifficultyAnalyzer
  ) {}

  createQuestion(
    themeId: string,
    text: string,
    options: string[],
    correctAnswerIndex: number,
    difficulty: QuestionDifficulty = QuestionDifficulty.MEDIUM
  ): Question {
    // Validate inputs
    const questionText = QuestionText.create(text);
    const questionOptions = QuestionOptions.create(options);
    const correctAnswer = AnswerIndex.create(correctAnswerIndex);

    // Create question
    const question = new Question(
      crypto.randomUUID(),
      themeId,
      questionText,
      questionOptions,
      correctAnswer,
      difficulty
    );

    // Auto-adjust difficulty based on content analysis
    const analyzedDifficulty = this.difficultyAnalyzer.analyzeDifficulty(question);
    if (analyzedDifficulty !== difficulty) {
      console.warn(`Question difficulty adjusted from ${difficulty} to ${analyzedDifficulty}`);
    }

    return question;
  }

  createQuestionFromTemplate(
    template: QuestionTemplate,
    variables: Record<string, string>
  ): Question {
    // Replace variables in template
    let text = template.textTemplate;
    const options = [...template.optionTemplates];

    for (const [key, value] of Object.entries(variables)) {
      text = text.replace(new RegExp(`{{${key}}}`, 'g'), value);
      for (let i = 0; i < options.length; i++) {
        options[i] = options[i].replace(new RegExp(`{{${key}}}`, 'g'), value);
      }
    }

    return this.createQuestion(
      template.themeId,
      text,
      options,
      template.correctAnswerIndex,
      template.difficulty
    );
  }

  validateQuestion(question: Question): QuestionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let qualityScore = 100;

    // Content validation
    const contentValidation = this.contentValidator.validate(question);
    if (!contentValidation.isValid) {
      errors.push(...contentValidation.errors);
      qualityScore -= 20;
    }

    // Quality checks
    const text = question.getText().getValue();
    const options = question.getOptions().getOptions();

    // Check for ambiguous wording
    if (this.hasAmbiguousWording(text)) {
      warnings.push('Question text may be ambiguous');
      qualityScore -= 10;
    }

    // Check option similarity
    if (this.hasOverlappingOptions([...options])) {
      warnings.push('Some answer options are too similar');
      qualityScore -= 15;
    }

    // Check difficulty alignment
    const expectedDifficulty = this.difficultyAnalyzer.analyzeDifficulty(question);
    if (expectedDifficulty !== question.getDifficulty()) {
      warnings.push(`Question difficulty may not match classification`);
      qualityScore -= 5;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qualityScore: Math.max(0, qualityScore)
    };
  }

  private hasAmbiguousWording(text: string): boolean {
    const ambiguousWords = ['maybe', 'might', 'could', 'sometimes', 'usually'];
    return ambiguousWords.some(word => text.toLowerCase().includes(word));
  }

  private hasOverlappingOptions(options: string[]): boolean {
    for (let i = 0; i < options.length; i++) {
      for (let j = i + 1; j < options.length; j++) {
        const similarity = this.calculateStringSimilarity(options[i], options[j]);
        if (similarity > 0.8) {
          return true;
        }
      }
    }
    return false;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple similarity calculation (could be enhanced with proper algorithm)
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

// Supporting services
interface ContentValidator {
  validate(question: Question): { isValid: boolean; errors: string[] };
}

interface DifficultyAnalyzer {
  analyzeDifficulty(question: Question): QuestionDifficulty;
}

interface QuestionSelectionService {
  selectQuestionsByDifficulty(
    themeId: string, 
    difficulty: QuestionDifficulty, 
    count: number
  ): Promise<Question[]>;
}

interface DifficultyCalculationService {
  calculateOptimalDifficulty(playerHistory: any[]): QuestionDifficulty;
}

// Factory Registry for managing multiple factories
export class FactoryRegistry {
  private factories = new Map<string, any>();

  register<T>(name: string, factory: T): void {
    this.factories.set(name, factory);
  }

  get<T>(name: string): T {
    const factory = this.factories.get(name);
    if (!factory) {
      throw new Error(`Factory '${name}' not found`);
    }
    return factory as T;
  }

  getGameFactory(): GameFactory {
    return this.get<GameFactory>('gameFactory');
  }

  getQuestionFactory(): QuestionFactory {
    return this.get<QuestionFactory>('questionFactory');
  }
}

// Abstract Factory for creating families of related objects
export interface GameComponentFactory {
  createGame(config: GameConfig): Promise<Game>;
  createQuestions(config: QuestionConfig): Promise<Question[]>;
  createTheme(config: ThemeConfig): Promise<Theme>;
}

export interface GameConfig {
  type: 'STANDARD' | 'TOURNAMENT' | 'PRACTICE';
  players: PlayerId[];
  themeId: string;
  difficulty?: QuestionDifficulty;
  customRules?: any;
}

export interface QuestionConfig {
  themeId: string;
  count: number;
  difficulty: QuestionDifficulty;
  excludeIds?: string[];
}

export interface ThemeConfig {
  name: string;
  description: string;
  category: string;
  tags: string[];
}

export class StandardGameComponentFactory implements GameComponentFactory {
  constructor(
    private readonly gameFactory: GameFactory,
    private readonly questionFactory: QuestionFactory,
    private readonly questionRepository: QuestionRepository
  ) {}

  async createGame(config: GameConfig): Promise<Game> {
    switch (config.type) {
      case 'STANDARD':
        return this.gameFactory.createStandardGame(config.players[0], config.themeId);
      case 'TOURNAMENT':
        return this.gameFactory.createTournamentGame(
          config.players, 
          config.themeId, 
          config.customRules
        );
      case 'PRACTICE':
        return this.gameFactory.createPracticeGame(
          config.players[0], 
          config.themeId, 
          config.difficulty || QuestionDifficulty.MEDIUM
        );
      default:
        throw new Error(`Unsupported game type: ${config.type}`);
    }
  }

  async createQuestions(config: QuestionConfig): Promise<Question[]> {
    return this.questionRepository.getRandomQuestionsByTheme(
      config.themeId, 
      config.count
    );
  }

  async createTheme(config: ThemeConfig): Promise<Theme> {
    return new Theme(
      crypto.randomUUID(),
      config.name,
      config.description,
      true, // isActive
      0 // questionCount - would be set later
    );
  }
}