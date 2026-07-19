// tests/readinessEngine.test.js
//
// Verifies calculateReadiness() no longer throws a ReferenceError (Issue
// #2536). Previously `user` was declared inside the `if (!userMetrics)`
// block but referenced afterward when building `careerTrackRecommendations`,
// throwing on every call.

describe('readinessEngine - calculateReadiness', () => {
  it('resolves successfully when explicit metrics are provided (no user lookup needed)', async () => {
    const { calculateReadiness } = await import('../backend/services/readinessEngine.js');

    const result = await calculateReadiness('user-with-metrics', {
      easySolved: 10,
      mediumSolved: 5,
      hardSolved: 2,
      streak: 3,
      completionRate: 80,
      topicsCovered: ['arrays', 'strings'],
      lastActivity: new Date().toISOString(),
    });

    expect(result).toBeTruthy();
    expect(result.userId).toBe('user-with-metrics');
    expect(typeof result.overallScore).toBe('number');
    expect(Number.isNaN(result.overallScore)).toBe(false);
    expect(typeof result.level).toBe('string');
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it('resolves successfully when no explicit metrics are given (reads from users.json, exercising the previously-buggy scope)', async () => {
    const { calculateReadiness } = await import('../backend/services/readinessEngine.js');

    // No metrics passed -> triggers the `if (!userMetrics)` branch that
    // declares `user`, and then reaches the `careerTrackRecommendations`
    // line that referenced `user` out of scope before the fix.
    await expect(calculateReadiness('some-user-id-not-in-file', null)).resolves.toBeTruthy();
  });

  it('includes a careerTrackRecommendations field without throwing', async () => {
    const { calculateReadiness } = await import('../backend/services/readinessEngine.js');

    const result = await calculateReadiness('another-user-id', null);
    expect(Array.isArray(result.careerTrackRecommendations)).toBe(true);
  });

  it('defaults to the fullstack track when neither a stored user nor metrics specify a careerTrack', async () => {
    const { calculateReadiness, invalidateCache } = await import('../backend/services/readinessEngine.js');
    invalidateCache();

    const result = await calculateReadiness('yet-another-user-id', {
      easySolved: 1,
      mediumSolved: 1,
      hardSolved: 1,
      streak: 1,
      completionRate: 50,
      topicsCovered: [],
      lastActivity: new Date().toISOString(),
    });

    expect(result.careerTrackRecommendations).toEqual(
      expect.arrayContaining(['JavaScript', 'Node.js', 'React', 'SQL', 'CSS'])
    );
  });
});
