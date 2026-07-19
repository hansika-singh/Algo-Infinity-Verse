// tests/revisionDuePopup.test.js

import { countDueReviews } from '../modules/revisionDuePopup.js';

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

describe('revisionDuePopup - countDueReviews', () => {
  it('returns 0 when there is no schedule', () => {
    expect(countDueReviews({})).toBe(0);
    expect(countDueReviews({ revisionSchedule: {} })).toBe(0);
  });

  it('counts overdue and due-today topics', () => {
    const progress = {
      revisionSchedule: {
        arrays: { nextReviewDate: daysFromNow(-2) }, // overdue
        strings: { nextReviewDate: daysFromNow(0) }, // due today
      },
    };
    expect(countDueReviews(progress)).toBe(2);
  });

  it('ignores topics scheduled in the future', () => {
    const progress = {
      revisionSchedule: {
        arrays: { nextReviewDate: daysFromNow(3) },
        strings: { nextReviewDate: daysFromNow(10) },
      },
    };
    expect(countDueReviews(progress)).toBe(0);
  });

  it('ignores completed topics even if their date has passed', () => {
    const progress = {
      revisionSchedule: {
        arrays: { nextReviewDate: daysFromNow(-5), isComplete: true },
      },
    };
    expect(countDueReviews(progress)).toBe(0);
  });

  it('ignores entries without a valid nextReviewDate', () => {
    const progress = {
      revisionSchedule: {
        arrays: {},
        strings: { nextReviewDate: null },
        trees: { nextReviewDate: 'not-a-date' },
      },
    };
    expect(countDueReviews(progress)).toBe(0);
  });
});
