// utils/spacedRepetition.js

const QUEUE_KEY = 'algoInfinityReviewQueue';

/**
 * Retrieves the review queue from localStorage
 * @returns {Object} Queue indexed by itemId
 */
export function getReviewQueue() {
  try {
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Failed to load review queue:", e);
    return {};
  }
}

/**
 * Saves the review queue to localStorage
 * @param {Object} queue 
 */
export function saveReviewQueue(queue) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error("Failed to save review queue:", e);
  }
}

/**
 * Get items due for review today or earlier
 * @returns {Array} List of due items
 */
export function getDueItems() {
  const queue = getReviewQueue();
  const now = Date.now();
  return Object.values(queue).filter(item => item.nextReviewDate <= now);
}

/**
 * Simplified SM-2 Algorithm
 * Schedules a review based on correctness and time taken.
 * 
 * @param {string} itemId Unique identifier (e.g., question ID or problem name)
 * @param {string} topic Category/Topic of the item
 * @param {string} difficulty Easy/Medium/Hard
 * @param {boolean} isCorrect Whether the answer was correct
 * @param {number} timeToSolve Time taken to solve in seconds (optional)
 */
export function scheduleReview(itemId, topic, difficulty, isCorrect, timeToSolve = 30) {
  const queue = getReviewQueue();
  
  let record = queue[itemId] || {
    id: itemId,
    topic: topic,
    difficulty: difficulty,
    repetition: 0,
    interval: 1,
    easeFactor: 2.5,
    nextReviewDate: Date.now()
  };

  // Calculate Quality (0-5)
  // 5: Perfect response
  // 4: Correct after hesitation
  // 3: Correct but difficult
  // 2: Incorrect, but remembered correct answer upon seeing it
  // 1: Incorrect, remembered upon seeing
  // 0: Complete blackout
  
  let quality = 0;
  if (isCorrect) {
    if (timeToSolve < 15) quality = 5;
    else if (timeToSolve < 60) quality = 4;
    else quality = 3;
  } else {
    if (timeToSolve < 30) quality = 2; // Failed quickly
    else quality = 1; // Failed after struggling
  }

  // Calculate Repetition and Interval
  if (quality >= 3) {
    // Correct
    if (record.repetition === 0) {
      record.interval = 1;
    } else if (record.repetition === 1) {
      record.interval = 3;
    } else {
      record.interval = Math.round(record.interval * record.easeFactor);
    }
    record.repetition += 1;
  } else {
    // Incorrect
    record.repetition = 0;
    record.interval = 1;
  }

  // Calculate Ease Factor
  record.easeFactor = record.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (record.easeFactor < 1.3) {
    record.easeFactor = 1.3;
  }

  // Set Next Review Date
  const daysInMs = record.interval * 24 * 60 * 60 * 1000;
  record.nextReviewDate = Date.now() + daysInMs;
  
  // Save back to queue
  queue[itemId] = record;
  saveReviewQueue(queue);
  
  return record;
}

// Make it available globally if used without modules
if (typeof window !== 'undefined') {
  window.spacedRepetition = {
    getReviewQueue,
    saveReviewQueue,
    getDueItems,
    scheduleReview
  };
}
