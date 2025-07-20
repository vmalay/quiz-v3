import { SCORING } from './types';

/**
 * Calculate points for a correct answer based on response time
 */
export function calculatePoints(responseTimeMs: number): number {
  if (responseTimeMs >= SCORING.QUESTION_TIME_LIMIT) {
    return 0;
  }

  const remainingTimeMs = SCORING.QUESTION_TIME_LIMIT - responseTimeMs;
  const timeBonus = Math.round(remainingTimeMs * SCORING.TIME_BONUS_MULTIPLIER);
  const basePoints = SCORING.MAX_POINTS_PER_QUESTION - timeBonus;

  return Math.max(basePoints + timeBonus, 0);
}

/**
 * Generate a unique player ID
 */
export function generatePlayerId(): string {
  return crypto.randomUUID();
}

/**
 * Generate a unique game ID
 */
export function generateGameId(): string {
  return crypto.randomUUID();
}

/**
 * Validate if an answer index is valid (0-3)
 */
export function isValidAnswerIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index <= 3;
}

/**
 * Calculate accuracy percentage
 */
export function calculateAccuracy(correctAnswers: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
}
