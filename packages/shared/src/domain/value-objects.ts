// Value Objects - Immutable objects that represent domain concepts

export class PlayerId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('PlayerId cannot be empty');
    }
  }

  static create(value: string): PlayerId {
    return new PlayerId(value);
  }

  static generate(): PlayerId {
    return new PlayerId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: PlayerId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class GameId {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('GameId cannot be empty');
    }
  }

  static create(value: string): GameId {
    return new GameId(value);
  }

  static generate(): GameId {
    return new GameId(crypto.randomUUID());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: GameId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class Score {
  private constructor(private readonly value: number) {
    if (value < 0) {
      throw new Error('Score cannot be negative');
    }
    if (!Number.isInteger(value)) {
      throw new Error('Score must be an integer');
    }
  }

  static create(value: number): Score {
    return new Score(value);
  }

  static zero(): Score {
    return new Score(0);
  }

  getValue(): number {
    return this.value;
  }

  add(points: number): Score {
    return new Score(this.value + points);
  }

  isGreaterThan(other: Score): boolean {
    return this.value > other.value;
  }

  equals(other: Score): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value.toString();
  }
}

export class ResponseTime {
  private constructor(private readonly milliseconds: number) {
    if (milliseconds < 0) {
      throw new Error('Response time cannot be negative');
    }
  }

  static create(milliseconds: number): ResponseTime {
    return new ResponseTime(milliseconds);
  }

  static fromDates(start: Date, end: Date): ResponseTime {
    const diff = end.getTime() - start.getTime();
    return new ResponseTime(Math.max(0, diff));
  }

  getMilliseconds(): number {
    return this.milliseconds;
  }

  getSeconds(): number {
    return this.milliseconds / 1000;
  }

  isWithinLimit(limitMs: number): boolean {
    return this.milliseconds <= limitMs;
  }

  toString(): string {
    return `${this.milliseconds}ms`;
  }
}

export class AnswerIndex {
  private constructor(private readonly value: number) {
    if (!Number.isInteger(value) || value < 0 || value > 3) {
      throw new Error('Answer index must be an integer between 0 and 3');
    }
  }

  static create(value: number): AnswerIndex {
    return new AnswerIndex(value);
  }

  getValue(): number {
    return this.value;
  }

  equals(other: AnswerIndex): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value.toString();
  }
}

export class QuestionText {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Question text cannot be empty');
    }
    if (value.length > 500) {
      throw new Error('Question text cannot exceed 500 characters');
    }
  }

  static create(value: string): QuestionText {
    return new QuestionText(value.trim());
  }

  getValue(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }
}

export class QuestionOptions {
  private constructor(private readonly options: string[]) {
    if (options.length !== 4) {
      throw new Error('Question must have exactly 4 options');
    }
    if (options.some(option => !option || option.trim().length === 0)) {
      throw new Error('All question options must be non-empty');
    }
    if (new Set(options).size !== options.length) {
      throw new Error('Question options must be unique');
    }
  }

  static create(options: string[]): QuestionOptions {
    return new QuestionOptions(options.map(opt => opt.trim()));
  }

  getOptions(): readonly string[] {
    return [...this.options];
  }

  getOption(index: AnswerIndex): string {
    return this.options[index.getValue()];
  }

  toString(): string {
    return this.options.join(', ');
  }
}