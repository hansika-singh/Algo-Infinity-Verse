import { buildRevisionTasks, toggleRevisionTaskCompletion } from '../modules/revisionScheduler.js';

describe('revision scheduler', () => {
  const baseProgress = {
    completedProblems: [1],
    quizScores: {
      arrays: { bestScore: 55, attempts: 1 },
      strings: { bestScore: 90, attempts: 1 }
    },
    revisionSchedule: {
      arrays: { currentStage: 0, nextReviewDate: null, history: [] },
      strings: { currentStage: 0, nextReviewDate: null, history: [] }
    },
    xp: 0,
    reviewStreak: 0,
    revisionCalendar: {
      tasks: [],
      history: [],
      streak: 0,
      longestStreak: 0,
      missedDays: 0,
      stats: {}
    }
  };

  beforeEach(() => {
    globalThis.dsaTopics = [
      { name: 'Arrays', description: 'Arrays', difficulty: 'Easy' },
      { name: 'Strings', description: 'Strings', difficulty: 'Medium' }
    ];
    globalThis.practiceProblems = [
      { id: 1, title: 'Two Sum', category: 'arrays', difficulty: 'easy' },
      { id: 2, title: 'Valid Parentheses', category: 'strings', difficulty: 'easy' }
    ];
  });

  it('builds a prioritized revision task from weak topics', () => {
    const state = buildRevisionTasks(baseProgress);
    expect(Array.isArray(state.tasks)).toBe(true);
    expect(state.tasks.length).toBeGreaterThan(0);
    expect(state.tasks[0].topicKey).toBe('arrays');
    expect(state.tasks[0].priority).toBe('high');
  });

  it('advances the schedule and streak after completing a task', () => {
    const state = buildRevisionTasks(baseProgress);
    const task = state.tasks[0];
    const updated = toggleRevisionTaskCompletion(task.id, baseProgress);
    expect(updated.revisionSchedule.arrays.currentStage).toBe(1);
    expect(updated.revisionCalendar.streak).toBe(1);
    expect(updated.xp).toBeGreaterThan(0);
  });
});
