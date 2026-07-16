// tests/quizQuestionsData.test.js
//
// Data-quality validation for the quiz question bank. Loads
// data/quiz-questions.js (which assigns to window.quizQuestions) by
// evaluating its source against a minimal window shim, then asserts
// every question is well-formed. This would have caught the arrays-3
// duplicate-option bug (#2432).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadQuizQuestions() {
  const source = fs.readFileSync(
    path.resolve(__dirname, '../data/quiz-questions.js'),
    'utf-8'
  );
  const sandbox = { window: {} };
  // eslint-disable-next-line no-new-func
  const run = new Function('window', source);
  run(sandbox.window);
  return sandbox.window.quizQuestions;
}

describe('quiz questions data quality', () => {
  const quizQuestions = loadQuizQuestions();
  const topics = Object.keys(quizQuestions || {});

  it('loads a non-empty quiz question bank', () => {
    expect(quizQuestions).toBeTruthy();
    expect(topics.length).toBeGreaterThan(0);
  });

  describe.each(topics)('topic: %s', (topicKey) => {
    const questions = quizQuestions[topicKey];

    it('is a non-empty array of questions', () => {
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThan(0);
    });

    it.each(questions.map((q, i) => [q.id || `#${i}`, q]))(
      '%s has a valid shape',
      (_label, question) => {
        expect(typeof question.id).toBe('string');
        expect(question.id.length).toBeGreaterThan(0);

        expect(typeof question.question).toBe('string');
        expect(question.question.trim().length).toBeGreaterThan(0);

        expect(typeof question.explanation).toBe('string');
        expect(question.explanation.trim().length).toBeGreaterThan(0);

        expect(Array.isArray(question.options)).toBe(true);
        expect(question.options).toHaveLength(4);

        // All 4 options must be unique (catches bugs like the arrays-3 duplicate "O(1)").
        const uniqueOptions = new Set(question.options.map((opt) => String(opt).trim()));
        expect(uniqueOptions.size).toBe(question.options.length);

        expect(Number.isInteger(question.correct)).toBe(true);
        expect(question.correct).toBeGreaterThanOrEqual(0);
        expect(question.correct).toBeLessThanOrEqual(3);
      }
    );

    it('has unique question ids within the topic', () => {
      const ids = questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
