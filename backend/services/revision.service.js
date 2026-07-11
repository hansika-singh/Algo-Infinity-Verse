// backend/services/revision.service.js

export const DEFAULT_INTERVALS = [1, 3, 7, 14, 30];

export class RevisionService {
  constructor(intervals = DEFAULT_INTERVALS) {
    this.intervals = intervals;
  }

  /**
   * Calculates the next revision stage, interval in days, and review date.
   * @param {Object} currentSchedule - { currentStage, history }
   * @param {Object} options - { scorePercentage, isIncorrect, isSkip, difficulty }
   * @returns {Object} { nextStage, intervalDays, nextReviewDate }
   */
  calculateNext(currentSchedule = {}, options = {}) {
    const stage = Number(currentSchedule.currentStage || 0);
    const { scorePercentage = 100, isIncorrect = false, isSkip = false, difficulty = "Medium" } = options;

    if (isSkip) {
      // Just postpone by 1 day, keep current stage
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);
      return {
        nextStage: stage,
        intervalDays: 1,
        nextReviewDate: nextDate.toISOString()
      };
    }

    if (isIncorrect || scorePercentage < 60) {
      // Reset stage to 0 and schedule for tomorrow
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);
      return {
        nextStage: 0,
        intervalDays: 1,
        nextReviewDate: nextDate.toISOString()
      };
    }

    // Advance to the next stage
    const nextStage = Math.min(this.intervals.length - 1, stage + 1);
    let baseInterval = this.intervals[nextStage] || 1;

    // Apply difficulty weights: Easy topics have longer gaps; Hard topics have shorter gaps (revised more frequently)
    let difficultyMultiplier = 1.0;
    const normalizedDifficulty = String(difficulty).toLowerCase();
    if (normalizedDifficulty.includes("easy")) {
      difficultyMultiplier = 1.3;
    } else if (normalizedDifficulty.includes("hard")) {
      difficultyMultiplier = 0.7;
    }

    // Apply score multipliers
    let scoreMultiplier = 1.0;
    if (scorePercentage >= 90) {
      scoreMultiplier = 1.5;
    } else if (scorePercentage >= 80) {
      scoreMultiplier = 1.2;
    }

    const intervalDays = Math.max(1, Math.round(baseInterval * difficultyMultiplier * scoreMultiplier));

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);

    return {
      nextStage,
      intervalDays,
      nextReviewDate: nextDate.toISOString()
    };
  }
}

export const defaultRevisionService = new RevisionService();

/**
 * Convenience helper to delegate to default service instance.
 */
export function calculateNextRevision(currentSchedule, options) {
  return defaultRevisionService.calculateNext(currentSchedule, options);
}
