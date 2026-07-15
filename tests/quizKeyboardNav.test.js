// tests/quizKeyboardNav.test.js
//
// Unit tests for the pure keyboard-navigation helper used by the
// accessible quiz option radiogroup (Issue #2333).

import { getNextOptionIndex } from '../modules/quiz-game.js';

describe('quiz-game - getNextOptionIndex', () => {
  it('moves forward on ArrowDown / ArrowRight, wrapping at the end', () => {
    expect(getNextOptionIndex('ArrowDown', 0, 4)).toBe(1);
    expect(getNextOptionIndex('ArrowRight', 2, 4)).toBe(3);
    expect(getNextOptionIndex('ArrowDown', 3, 4)).toBe(0); // wraps
  });

  it('moves backward on ArrowUp / ArrowLeft, wrapping at the start', () => {
    expect(getNextOptionIndex('ArrowUp', 2, 4)).toBe(1);
    expect(getNextOptionIndex('ArrowLeft', 1, 4)).toBe(0);
    expect(getNextOptionIndex('ArrowUp', 0, 4)).toBe(3); // wraps
  });

  it('jumps to the first option on Home and last option on End', () => {
    expect(getNextOptionIndex('Home', 2, 4)).toBe(0);
    expect(getNextOptionIndex('End', 0, 4)).toBe(3);
  });

  it('returns null for keys that should not move focus', () => {
    expect(getNextOptionIndex('Enter', 1, 4)).toBeNull();
    expect(getNextOptionIndex(' ', 1, 4)).toBeNull();
    expect(getNextOptionIndex('Tab', 1, 4)).toBeNull();
    expect(getNextOptionIndex('a', 1, 4)).toBeNull();
  });

  it('returns null when there are no options', () => {
    expect(getNextOptionIndex('ArrowDown', 0, 0)).toBeNull();
  });

  it('handles a single option without going out of bounds', () => {
    expect(getNextOptionIndex('ArrowDown', 0, 1)).toBe(0);
    expect(getNextOptionIndex('ArrowUp', 0, 1)).toBe(0);
  });
});
