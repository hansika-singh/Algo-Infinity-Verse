// modules/revisionEngine.js

export const DEFAULT_INTERVALS = [1, 3, 7, 14, 30];

export class RevisionEngine {
  constructor(intervals = DEFAULT_INTERVALS) {
    this.intervals = intervals;
  }

  /**
   * Calculates the next review stage, interval in days, and review date.
   * FIXED: Now handles last stage properly with isComplete flag
   *
   * @param {Object} currentSchedule - { currentStage, history }
   * @param {Object} options - { scorePercentage, isIncorrect, isSkip, difficulty }
   * @param {Object} config - { passThreshold, markCompleteAfterLast, maxStages }
   * @returns {Object} { nextStage, intervalDays, nextReviewDate, isComplete, message }
   */
  calculateNext(currentSchedule = {}, options = {}, config = {}) {
    const stage = Number(currentSchedule.currentStage || 0);
    const {
      scorePercentage = 100,
      isIncorrect = false,
      isSkip = false,
      difficulty = 'Medium',
    } = options;

    //  Configuration with defaults
    const passThreshold = config?.passThreshold || 60;
    const markCompleteAfterLast = config?.markCompleteAfterLast !== false;
    const maxStages = config?.maxStages || this.intervals.length;

    //  If skipped, postpone by 1 day
    if (isSkip) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);
      return {
        nextStage: stage,
        intervalDays: 1,
        nextReviewDate: nextDate.toISOString(),
        isComplete: false,
        message: ' Review postponed by 1 day',
      };
    }

    //  If incorrect OR score < 60%, reset to stage 0
    if (isIncorrect || scorePercentage < passThreshold) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 1);
      return {
        nextStage: 0,
        intervalDays: 1,
        nextReviewDate: nextDate.toISOString(),
        isComplete: false,
        message: ` Score ${scorePercentage}% below ${passThreshold}%, resetting to stage 0`,
      };
    }

    //  CRITICAL FIX: Check if this is the LAST stage
    const isLastStage = stage >= maxStages - 1;

    //  If last stage and score is good → MARK AS COMPLETE! 🎉
    if (isLastStage && scorePercentage >= passThreshold) {
      if (markCompleteAfterLast) {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 30); // 30 days for completion review

        return {
          nextStage: stage,
          intervalDays: 30,
          nextReviewDate: nextDate.toISOString(),
          isComplete: true, //  KEY FIX: Mark as complete!
          message: " All revision stages completed successfully! You've mastered this topic! 🏆",
        };
      } else {
        // Alternative: Continue with increasing intervals
        const lastInterval = this.intervals[stage] || 30;
        const increasedInterval = lastInterval * 2;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + increasedInterval);

        return {
          nextStage: stage,
          intervalDays: increasedInterval,
          nextReviewDate: nextDate.toISOString(),
          isComplete: false,
          message: ` Perfect score! Next review in ${increasedInterval} days (doubled interval)`,
        };
      }
    }

    //  Normal progression: Move to next stage (perfect scores use the same
    //  single-step progression below, boosted by the 1.5x score multiplier)
    const nextStage = Math.min(stage + 1, maxStages - 1);
    let baseInterval = this.intervals[nextStage] || 1;

    //  Apply difficulty weights: Easy = 1.3x gap, Hard = 0.7x gap
    let difficultyMultiplier = 1.0;
    const normalizedDifficulty = String(difficulty).toLowerCase();
    if (normalizedDifficulty.includes('easy')) {
      difficultyMultiplier = 1.3;
    } else if (normalizedDifficulty.includes('hard')) {
      difficultyMultiplier = 0.7;
    }

    //  Apply score multipliers: Excellent scores push next review further
    let scoreMultiplier = 1.0;
    if (scorePercentage >= 90) {
      scoreMultiplier = 1.5;
    } else if (scorePercentage >= 80) {
      scoreMultiplier = 1.2;
    }

    const intervalDays = Math.max(
      1,
      Math.round(baseInterval * difficultyMultiplier * scoreMultiplier)
    );

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);

    const isComplete = nextStage >= maxStages - 1 && markCompleteAfterLast;

    return {
      nextStage,
      intervalDays,
      nextReviewDate: nextDate.toISOString(),
      isComplete: isComplete,
      message: isComplete
        ? "All stages complete! You're done! "
        : ` Moving to stage ${nextStage + 1} of ${maxStages} (${Math.round(((nextStage + 1) / maxStages) * 100)}% complete)`,
    };
  }

  /**
   * Reset revision progress for a topic
   * @returns {Object} Reset schedule
   */
  resetProgress() {
    return {
      currentStage: 0,
      history: [],
      isComplete: false,
    };
  }
}

export const defaultRevisionEngine = new RevisionEngine();
