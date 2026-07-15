// tests/quizScoring.test.js

import {
  shuffle,
  countCorrect,
  calculatePercentage,
  calculateXp,
  updateQuizRecord,
  XP_PER_CORRECT_ANSWER,
} from '../modules/quizScoring.js';

describe('quizScoring - calculatePercentage', () => {
  it('returns the correct rounded percentage', () => {
    expect(calculatePercentage(10, 10)).toBe(100);
    expect(calculatePercentage(5, 10)).toBe(50);
    expect(calculatePercentage(0, 10)).toBe(0);
    expect(calculatePercentage(1, 3)).toBe(33); // 33.33 -> 33
    expect(calculatePercentage(2, 3)).toBe(67); // 66.66 -> 67
  });

  it('returns 0 when there are no questions', () => {
    expect(calculatePercentage(0, 0)).toBe(0);
    expect(calculatePercentage(5, 0)).toBe(0);
  });
});

describe('quizScoring - calculateXp', () => {
  it('awards 10 XP per correct answer', () => {
    expect(XP_PER_CORRECT_ANSWER).toBe(10);
    expect(calculateXp(0)).toBe(0);
    expect(calculateXp(1)).toBe(10);
    expect(calculateXp(7)).toBe(70);
    expect(calculateXp(10)).toBe(100);
  });

  it('never returns negative XP', () => {
    expect(calculateXp(-3)).toBe(0);
  });
});

describe('quizScoring - countCorrect', () => {
  const questions = [
    { correct: 0 },
    { correct: 2 },
    { correct: 1 },
    { correct: 3 },
  ];

  it('counts matching selections', () => {
    expect(countCorrect(questions, [0, 2, 1, 3])).toBe(4);
    expect(countCorrect(questions, [0, 0, 1, 0])).toBe(2);
    expect(countCorrect(questions, [1, 1, 0, 0])).toBe(0);
  });

  it('treats unanswered questions as incorrect', () => {
    expect(countCorrect(questions, [0, undefined, 1, null])).toBe(2);
    expect(countCorrect(questions, [])).toBe(0);
  });
});

describe('quizScoring - updateQuizRecord', () => {
  it('increments attempts and accumulates XP', () => {
    const first = updateQuizRecord(undefined, { percentage: 40, xpEarned: 40 });
    expect(first).toEqual({ bestScore: 40, attempts: 1, totalXP: 40 });

    const second = updateQuizRecord(first, { percentage: 80, xpEarned: 80 });
    expect(second).toEqual({ bestScore: 80, attempts: 2, totalXP: 120 });
  });

  it('only raises bestScore, never lowers it', () => {
    const record = { bestScore: 90, attempts: 3, totalXP: 300 };
    const updated = updateQuizRecord(record, { percentage: 50, xpEarned: 50 });
    expect(updated.bestScore).toBe(90);
    expect(updated.attempts).toBe(4);
    expect(updated.totalXP).toBe(350);
  });

  it('does not mutate the input record', () => {
    const record = { bestScore: 10, attempts: 1, totalXP: 10 };
    const snapshot = { ...record };
    updateQuizRecord(record, { percentage: 100, xpEarned: 100 });
    expect(record).toEqual(snapshot);
  });
});

describe('quizScoring - shuffle', () => {
  it('returns a permutation with the same elements (none dropped or duplicated)', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = shuffle(input);
    expect(result).toHaveLength(input.length);
    expect([...result].sort((a, b) => a - b)).toEqual(input);
  });

  it('does not mutate the original array', () => {
    const input = ['a', 'b', 'c', 'd'];
    const snapshot = [...input];
    shuffle(input);
    expect(input).toEqual(snapshot);
  });

  it('preserves object references (same set of question objects)', () => {
    const q1 = { id: 1 };
    const q2 = { id: 2 };
    const q3 = { id: 3 };
    const result = shuffle([q1, q2, q3]);
    expect(result).toHaveLength(3);
    expect(new Set(result)).toEqual(new Set([q1, q2, q3]));
  });

  it('handles empty and single-element arrays', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle([42])).toEqual([42]);
  });

  it('produces a valid permutation across many randomized runs', () => {
    const input = Array.from({ length: 12 }, (_, i) => i);
    for (let run = 0; run < 200; run++) {
      const result = shuffle(input);
      expect([...result].sort((a, b) => a - b)).toEqual(input);
    }
  });
});
