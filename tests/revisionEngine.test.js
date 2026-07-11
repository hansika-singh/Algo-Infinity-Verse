// tests/revisionEngine.test.js

import { defaultRevisionEngine } from '../modules/revisionEngine.js';

describe('Revision Engine', () => {
  it('correctly returns stage 1 and tomorrow date for a clean slate topic', () => {
    const current = { currentStage: 0, history: [] };
    const result = defaultRevisionEngine.calculateNext(current, {
      scorePercentage: 70,
      difficulty: 'Medium'
    });

    expect(result.nextStage).toBe(1);
    expect(result.intervalDays).toBe(3); // base stage 1 interval is 3 days
    expect(new Date(result.nextReviewDate).getTime()).toBeGreaterThan(Date.now());
  });

  it('resets stage to 0 and sets tomorrow if score is under 60% (failure)', () => {
    const current = { currentStage: 3, history: [] };
    const result = defaultRevisionEngine.calculateNext(current, {
      scorePercentage: 45,
      difficulty: 'Medium'
    });

    expect(result.nextStage).toBe(0);
    expect(result.intervalDays).toBe(1);
  });

  it('resets stage to 0 if isIncorrect is true', () => {
    const current = { currentStage: 2, history: [] };
    const result = defaultRevisionEngine.calculateNext(current, {
      isIncorrect: true
    });

    expect(result.nextStage).toBe(0);
    expect(result.intervalDays).toBe(1);
  });

  it('applies difficulty multipliers: Easy increases interval, Hard decreases interval', () => {
    const current = { currentStage: 1, history: [] }; // base stage 2 is 7 days

    const resultEasy = defaultRevisionEngine.calculateNext(current, {
      scorePercentage: 70, // standard score (no multiplier)
      difficulty: 'Easy'
    });
    // 7 * 1.3 = 9.1 -> 9 days
    expect(resultEasy.intervalDays).toBe(9);

    const resultHard = defaultRevisionEngine.calculateNext(current, {
      scorePercentage: 70,
      difficulty: 'Hard'
    });
    // 7 * 0.7 = 4.9 -> 5 days
    expect(resultHard.intervalDays).toBe(5);
  });

  it('applies score multipliers: high score >= 90% boosts interval by 1.5x', () => {
    const current = { currentStage: 1, history: [] }; // base stage 2 is 7 days

    const resultPerfect = defaultRevisionEngine.calculateNext(current, {
      scorePercentage: 95,
      difficulty: 'Medium'
    });
    // 7 * 1.5 = 10.5 -> 11 days
    expect(resultPerfect.intervalDays).toBe(11);
  });

  it('keeps current stage but shifts date by 1 day if isSkip is true', () => {
    const current = { currentStage: 3, history: [] };
    const result = defaultRevisionEngine.calculateNext(current, {
      isSkip: true
    });

    expect(result.nextStage).toBe(3);
    expect(result.intervalDays).toBe(1);
  });
});
