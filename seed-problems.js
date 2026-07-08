// seed-problems.js  (place in project root, same level as server.js)
// Run once before using battle mode:
//   node seed-problems.js

import { initializeFirebase, getDb } from "./firebase.js";

const problems = [
  // ── Easy ──────────────────────────────────────────────────────────────────
  {
    title: "Two Sum",
    description:
      "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target. Each input has exactly one solution. You may not use the same element twice.",
    difficulty: "Easy",
    xpValue: 50,
    examples: ["Input: nums = [2,7,11,15], target = 9  →  Output: [0,1]"],
    constraints: ["2 ≤ nums.length ≤ 10^4", "Exactly one valid answer exists"],
  },
  {
    title: "Valid Parentheses",
    description:
      "Given a string containing only (, ), {, }, [ and ], determine if the input is valid. Every open bracket must be closed by the same type of bracket in the correct order.",
    difficulty: "Easy",
    xpValue: 50,
    examples: [
      'Input: s = "()[]{}"  →  Output: true',
      'Input: s = "(]"      →  Output: false',
    ],
    constraints: ["1 ≤ s.length ≤ 10^4", "s consists of bracket characters only"],
  },
  {
    title: "Binary Search",
    description:
      "Given a sorted array of distinct integers and a target value, return its index or -1 if not found. You must achieve O(log n) time complexity.",
    difficulty: "Easy",
    xpValue: 50,
    examples: ["Input: nums = [-1,0,3,5,9,12], target = 9  →  Output: 4"],
    constraints: ["1 ≤ nums.length ≤ 10^4", "All values are unique and sorted ascending"],
  },
  {
    title: "Reverse Linked List",
    description:
      "Given the head of a singly linked list, reverse the list and return the new head.",
    difficulty: "Easy",
    xpValue: 50,
    examples: ["Input: 1→2→3→4→5  →  Output: 5→4→3→2→1"],
    constraints: ["0 ≤ number of nodes ≤ 5000", "-5000 ≤ Node.val ≤ 5000"],
  },

  // ── Medium ────────────────────────────────────────────────────────────────
  {
    title: "Longest Substring Without Repeating Characters",
    description:
      "Given a string s, find the length of the longest substring that contains no repeating characters.",
    difficulty: "Medium",
    xpValue: 100,
    examples: ['Input: s = "abcabcbb"  →  Output: 3  (substring "abc")'],
    constraints: [
      "0 ≤ s.length ≤ 5 × 10^4",
      "s consists of English letters, digits, symbols and spaces",
    ],
  },
  {
    title: "Merge Intervals",
    description:
      "Given an array of intervals where intervals[i] = [start, end], merge all overlapping intervals and return the non-overlapping result.",
    difficulty: "Medium",
    xpValue: 100,
    examples: [
      "Input: [[1,3],[2,6],[8,10],[15,18]]  →  Output: [[1,6],[8,10],[15,18]]",
    ],
    constraints: ["1 ≤ intervals.length ≤ 10^4", "intervals[i].length == 2"],
  },
  {
    title: "3Sum",
    description:
      "Given an integer array nums, return all unique triplets [a, b, c] such that a + b + c = 0. The solution must not contain duplicate triplets.",
    difficulty: "Medium",
    xpValue: 100,
    examples: [
      "Input: nums = [-1,0,1,2,-1,-4]  →  Output: [[-1,-1,2],[-1,0,1]]",
    ],
    constraints: ["3 ≤ nums.length ≤ 3000", "-10^5 ≤ nums[i] ≤ 10^5"],
  },
  {
    title: "Coin Change",
    description:
      "Given an array of coin denominations and a target amount, return the fewest number of coins needed to reach that amount. Return -1 if it cannot be done.",
    difficulty: "Medium",
    xpValue: 100,
    examples: [
      "Input: coins = [1,5,6,9], amount = 11  →  Output: 2  (5+6)",
      "Input: coins = [2], amount = 3          →  Output: -1",
    ],
    constraints: ["1 ≤ coins.length ≤ 12", "0 ≤ amount ≤ 10^4"],
  },

  // ── Hard ──────────────────────────────────────────────────────────────────
  {
    title: "Median of Two Sorted Arrays",
    description:
      "Given two sorted arrays nums1 and nums2, return the median of the two arrays combined. The solution must run in O(log(m+n)) time.",
    difficulty: "Hard",
    xpValue: 150,
    examples: [
      "Input: nums1 = [1,3], nums2 = [2]    →  Output: 2.0",
      "Input: nums1 = [1,2], nums2 = [3,4]  →  Output: 2.5",
    ],
    constraints: ["0 ≤ m, n ≤ 1000", "-(10^6) ≤ nums[i] ≤ 10^6"],
  },
  {
    title: "Trapping Rain Water",
    description:
      "Given n non-negative integers representing an elevation map where each bar has width 1, compute how much rainwater it can trap between the bars.",
    difficulty: "Hard",
    xpValue: 150,
    examples: [
      "Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]  →  Output: 6",
    ],
    constraints: ["1 ≤ n ≤ 2 × 10^4", "0 ≤ height[i] ≤ 10^5"],
  },
  {
    title: "Word Ladder",
    description:
      "Given a beginWord, an endWord, and a word dictionary, return the length of the shortest transformation sequence from beginWord to endWord. Each step changes exactly one letter and every intermediate word must be in the dictionary. Return 0 if no sequence exists.",
    difficulty: "Hard",
    xpValue: 150,
    examples: [
      'Input: beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]  →  Output: 5',
    ],
    constraints: ["1 ≤ beginWord.length ≤ 10", "endWord must be in wordList"],
  },
];

async function seed() {
  // initializeFirebase must be called before getDb() returns anything useful.
  initializeFirebase();
  const firestore = getDb();

  if (!firestore) {
    console.error(
      "Firestore not initialized. " +
      "Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in your .env file."
    );
    process.exit(1);
  }

  void 0;

  const batch = firestore.batch();
  for (const problem of problems) {
    // Deterministic doc ID derived from the title so re-running the seed
    // updates existing problems (merge) instead of creating duplicates.
    const problemId = problem.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const ref = firestore.collection("problems").doc(problemId);
    batch.set(ref, { ...problem, createdAt: new Date() }, { merge: true });
  }

  await batch.commit();
  void 0;
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});