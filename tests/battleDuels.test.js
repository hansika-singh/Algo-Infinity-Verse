import { runDetailedTestCases } from '../pages/Dsa-Battle/Battleservice.js';

describe('Detailed DSA Battle Test Cases Evaluator', () => {
  it('should evaluate valid Two Sum implementation correctly', () => {
    const validCode = `
      function twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
          const comp = target - nums[i];
          if (map.has(comp)) {
            return [map.get(comp), i];
          }
          map.set(nums[i], i);
        }
        return [];
      }
    `;
    const results = runDetailedTestCases('Two Sum', validCode);
    expect(results).toEqual([true, true]);
  });

  it('should evaluate failing Two Sum implementation correctly', () => {
    const invalidCode = `
      function twoSum(nums, target) {
        return [0, 0];
      }
    `;
    const results = runDetailedTestCases('Two Sum', invalidCode);
    expect(results).toEqual([false, false]);
  });

  it('should evaluate syntax error code as failures without throwing exceptions', () => {
    const malformedCode = `
      function twoSum(nums, target) {
        const map = new Map(
      }
    `;
    const results = runDetailedTestCases('Two Sum', malformedCode);
    expect(results).toEqual([false, false]);
  });

  it('should evaluate valid Binary Search implementation correctly', () => {
    const validCode = `
      function search(nums, target) {
        let left = 0;
        let right = nums.length - 1;
        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          if (nums[mid] === target) return mid;
          if (nums[mid] < target) left = mid + 1;
          else right = mid - 1;
        }
        return -1;
      }
    `;
    const results = runDetailedTestCases('Binary Search', validCode);
    expect(results).toEqual([true, true]);
  });

  it('should evaluate valid Valid Parentheses implementation correctly', () => {
    const validCode = `
      function isValid(s) {
        const stack = [];
        const pairs = { ')': '(', '}': '{', ']': '[' };
        for (const char of s) {
          if (char === '(' || char === '{' || char === '[') {
            stack.push(char);
          } else {
            if (stack.pop() !== pairs[char]) return false;
          }
        }
        return stack.length === 0;
      }
    `;
    const results = runDetailedTestCases('Valid Parentheses', validCode);
    expect(results).toEqual([true, true]);
  });
});
