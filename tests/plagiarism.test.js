import { jest } from '@jest/globals';

// Mock firebase.js
const mockGet = jest.fn();
const mockAdd = jest.fn();

jest.unstable_mockModule('../firebase.js', () => ({
  getDb: () => ({
    collection: () => ({
      doc: () => ({
        get: mockGet,
      }),
      where: () => ({
        limit: () => ({
          get: () => ({
            docs: [
              {
                id: 'battle-other',
                data: () => ({
                  submissions: {
                    'player-other': {
                      code: `
                        function twoSum(nums, target) {
                          const mapping = new Map();
                          for (let i = 0; i < nums.length; i++) {
                            const comp = target - nums[i];
                            if (mapping.has(comp)) {
                              return [mapping.get(comp), i];
                            }
                            mapping.set(nums[i], i);
                          }
                          return [];
                        }
                      `,
                    },
                  },
                }),
              },
            ],
          }),
        }),
      }),
      add: mockAdd,
    }),
  }),
  COLLECTIONS: {
    PLAGIARISM_REPORTS: 'plagiarism_reports',
  },
}));

// Now import target modules
const {
  detectLanguage,
  getJsStructuralSequence,
  getStructuralSequence,
  calculateLevenshteinDistance,
  calculateSimilarity,
  checkAndFlagPlagiarism,
} = await import('../backend/services/plagiarism.service.js');

describe('AST-Based Plagiarism & Similarity Detection Engine', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockAdd.mockReset();
  });

  describe('Language Detection', () => {
    it('should detect JavaScript', () => {
      const jsCode = 'const x = 5;\nfunction test() { return x; }';
      expect(detectLanguage(jsCode)).toBe('javascript');
    });

    it('should detect Python', () => {
      const pyCode = 'def test_func(a):\n    print(a)\n    return a';
      expect(detectLanguage(pyCode)).toBe('python');
    });

    it('should detect C++', () => {
      const cppCode = '#include <iostream>\nusing namespace std;\nint main() { cout << "hello"; }';
      expect(detectLanguage(cppCode)).toBe('cpp');
    });
  });

  describe('AST Parsing and Tokenizing', () => {
    it('should generate same structural sequence for JS with renamed variables', () => {
      const code1 = `
        function solve(arr, k) {
          let cache = new Map();
          for (let i = 0; i < arr.length; i++) {
            let diff = k - arr[i];
            if (cache.has(diff)) {
              return [cache.get(diff), i];
            }
            cache.set(arr[i], i);
          }
          return [];
        }
      `;
      const code2 = `
        // Renamed variable structures
        function twoSum(nums, target) {
          const mapping = new Map();
          for (let idx = 0; idx < nums.length; idx++) {
            const comp = target - nums[idx];
            if (mapping.has(comp)) {
              return [mapping.get(comp), idx];
            }
            mapping.set(nums[idx], idx);
          }
          return [];
        }
      `;

      const seq1 = getJsStructuralSequence(code1);
      const seq2 = getJsStructuralSequence(code2);

      expect(seq1).toEqual(seq2);
      expect(seq1.length).toBeGreaterThan(0);
    });

    it('should fallback to tokenizer on JS syntax error', () => {
      const malformedJs = 'function hello( { if(true) { return 1; } ';
      const seq = getJsStructuralSequence(malformedJs);
      expect(seq).toContain('IfStatement');
      expect(seq).toContain('ReturnStatement');
    });

    it('should extract structural tokens from Python code', () => {
      const pyCode = `
        def twoSum(nums, target):
            # some comments
            mapping = {}
            for i, num in enumerate(nums):
                comp = target - num
                if comp in mapping:
                    return [mapping[comp], i]
                mapping[num] = i
            return []
      `;
      const seq = getStructuralSequence(pyCode, 'python');
      expect(seq).toContain('FunctionDeclaration');
      expect(seq).toContain('ForStatement');
      expect(seq).toContain('IfStatement');
      expect(seq).toContain('ReturnStatement');
    });

    it('should extract structural tokens from C++ code', () => {
      const cppCode = `
        vector<int> twoSum(vector<int>& nums, int target) {
          unordered_map<int, int> map;
          for (int i = 0; i < nums.size(); i++) {
            int comp = target - nums[i];
            if (map.count(comp)) {
              return {map[comp], i};
            }
            map[nums[i]] = i;
          }
          return {};
        }
      `;
      const seq = getStructuralSequence(cppCode, 'cpp');
      expect(seq).toContain('ForStatement');
      expect(seq).toContain('IfStatement');
      expect(seq).toContain('ReturnStatement');
    });
  });

  describe('Sequence Similarity Calculation', () => {
    it('should compute 100% similarity for identical token lists', () => {
      const seq1 = ['FunctionDeclaration', 'ForStatement', 'IfStatement', 'ReturnStatement'];
      const seq2 = ['FunctionDeclaration', 'ForStatement', 'IfStatement', 'ReturnStatement'];
      expect(calculateSimilarity(seq1, seq2)).toBe(100);
    });

    it('should compute partial similarity for slightly modified lists', () => {
      const seq1 = ['FunctionDeclaration', 'ForStatement', 'IfStatement', 'ReturnStatement'];
      // Replaced ForStatement with WhileStatement (1 edit)
      const seq2 = ['FunctionDeclaration', 'WhileStatement', 'IfStatement', 'ReturnStatement'];
      const sim = calculateSimilarity(seq1, seq2);
      expect(sim).toBe(75);
    });

    it('should compute 0% similarity for completely disjoint lists', () => {
      const seq1 = ['FunctionDeclaration'];
      const seq2 = ['ReturnStatement'];
      expect(calculateSimilarity(seq1, seq2)).toBe(0);
    });

    it('should compute correct Levenshtein distance', () => {
      const seq1 = ['FunctionDeclaration', 'ForStatement', 'IfStatement'];
      const seq2 = ['FunctionDeclaration', 'WhileStatement', 'IfStatement', 'ReturnStatement'];
      expect(calculateLevenshteinDistance(seq1, seq2)).toBe(2);
    });
  });

  describe('Check and Flag Plagiarism', () => {
    it('should flag submissions in Firestore that cross the threshold', async () => {
      const battleId = 'battle-current';
      const playerId = 'player-current';
      const code = `
        function solve(arr, k) {
          let cache = new Map();
          for (let i = 0; i < arr.length; i++) {
            let diff = k - arr[i];
            if (cache.has(diff)) {
              return [cache.get(diff), i];
            }
            cache.set(arr[i], i);
          }
          return [];
        }
      `;

      // Mock fetching current battle metadata
      mockGet.mockResolvedValue({
        exists: true,
        data: () => ({
          problemTitle: 'Two Sum',
        }),
      });

      await checkAndFlagPlagiarism(battleId, playerId, code);

      expect(mockAdd).toHaveBeenCalledTimes(1);
      const report = mockAdd.mock.calls[0][0];
      expect(report.battleId).toBe(battleId);
      expect(report.playerId).toBe(playerId);
      expect(report.similarityPercentage).toBe(100);
      expect(report.status).toBe('pending_review');
    });
  });
});
