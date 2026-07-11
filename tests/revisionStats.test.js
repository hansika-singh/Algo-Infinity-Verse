// tests/revisionStats.test.js

import { calculateStats } from '../modules/revisionStats.js';

describe('Revision Stats', () => {
  it('correctly calculates streak from historical date completions', () => {
    const today = new Date();
    const todayKey = toDateKey(today);
    
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const yesterdayKey = toDateKey(yesterday);

    const dayBefore = new Date();
    dayBefore.setDate(today.getDate() - 2);
    const dayBeforeKey = toDateKey(dayBefore);

    const userProgress = {
      revisionSchedule: {},
      revisionCalendar: {
        history: [
          { dayKey: dayBeforeKey, completed: true },
          { dayKey: yesterdayKey, completed: true },
          { dayKey: todayKey, completed: true }
        ]
      }
    };

    const stats = calculateStats(userProgress);
    expect(stats.streak).toBe(3);
  });

  it('identifies mastered and weakest topics correctly', () => {
    const userProgress = {
      quizScores: {
        arrays: { bestScore: 90, attempts: 2 }, // Mastered
        trees: { bestScore: 50, attempts: 1 }   // Weakest
      },
      revisionSchedule: {
        arrays: { currentStage: 3 }, // stage >= 3 & score >= 85
        trees: { currentStage: 1 }
      },
      revisionCalendar: { history: [] }
    };

    const stats = calculateStats(userProgress);
    expect(stats.masteredTopics).toContain('arrays');
    expect(stats.weakestTopics).toContain('trees');
  });

  it('calculates average retention estimate using memory half-life decay', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const userProgress = {
      quizScores: {},
      revisionSchedule: {
        // Reviewed 2 days ago with stage 2 (base interval 7 days, half-life 10.5 days)
        arrays: {
          currentStage: 2,
          history: [{ reviewedAt: twoDaysAgo.toISOString() }]
        }
      },
      revisionCalendar: { history: [] }
    };

    const stats = calculateStats(userProgress);
    // Retention should be near ~88% (0.5 ^ (2 / 10.5) = 87.6%)
    expect(stats.overallRetentionEstimate).toBeGreaterThan(80);
    expect(stats.overallRetentionEstimate).toBeLessThan(95);
  });
});

function toDateKey(date) {
  const value = new Date(date);
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
