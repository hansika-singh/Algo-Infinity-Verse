// tests/gamificationLevelBounds.test.js
//
// Verifies userProgress.level is always clamped to a valid index before
// being used to look up LEVEL_NAMES / topic arrays (Issue #2494).

import { clampLevel, LEVEL_THRESHOLDS, LEVEL_NAMES } from '../modules/gamification.js';

describe('gamification - clampLevel', () => {
  it('clamps 0 and negative levels up to 1', () => {
    expect(clampLevel(0)).toBe(1);
    expect(clampLevel(-5)).toBe(1);
  });

  it('treats undefined/null/NaN as level 1', () => {
    expect(clampLevel(undefined)).toBe(1);
    expect(clampLevel(null)).toBe(1);
    expect(clampLevel(NaN)).toBe(1);
    expect(clampLevel('not-a-number')).toBe(1);
  });

  it('passes through valid levels unchanged', () => {
    for (let level = 1; level <= LEVEL_THRESHOLDS.length; level++) {
      expect(clampLevel(level)).toBe(level);
    }
  });

  it('clamps levels beyond the max down to the highest valid level', () => {
    expect(clampLevel(9)).toBe(LEVEL_THRESHOLDS.length);
    expect(clampLevel(999)).toBe(LEVEL_THRESHOLDS.length);
  });

  it('truncates non-integer levels', () => {
    expect(clampLevel(3.7)).toBe(3);
  });

  it('guarantees the result always safely indexes LEVEL_NAMES', () => {
    const inputs = [0, -1, 1, 4, 8, 9, 100, undefined, null, NaN, 'x'];
    for (const input of inputs) {
      const level = clampLevel(input);
      expect(LEVEL_NAMES[level - 1]).toBeDefined();
      expect(typeof LEVEL_NAMES[level - 1]).toBe('string');
    }
  });

  it('LEVEL_THRESHOLDS and LEVEL_NAMES stay in sync (same length)', () => {
    expect(LEVEL_NAMES.length).toBe(LEVEL_THRESHOLDS.length);
  });
});
