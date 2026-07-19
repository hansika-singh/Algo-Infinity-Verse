import { jest } from '@jest/globals';

const mockZcard = jest.fn();
const mockZrevrange = jest.fn();
const mockZadd = jest.fn();
const mockPipeline = jest.fn();
const mockGetAll = jest.fn();
const mockAddQueue = jest.fn();

// Mock Redis client and BullMQ Queue
jest.unstable_mockModule('../backend/jobs/queue.js', () => ({
  redisAvailable: true,
  redisClient: {
    zcard: mockZcard,
    zrevrange: mockZrevrange,
    zadd: mockZadd,
    pipeline: mockPipeline,
  },
  leaderboardQueue: {
    add: mockAddQueue,
  },
  enqueueLeaderboardUpdate: async (userId, xp) => {
    await mockAddQueue('update-score', { userId, xp: Number(xp) });
  },
}));

// Mock firebase
jest.unstable_mockModule('../firebase.js', () => ({
  getDb: () => ({
    getAll: mockGetAll,
    collection: () => ({
      get: () => ({
        docs: [
          { id: 'user-1', data: () => ({ name: 'Alice', xp: 100, level: 3 }) },
          { id: 'user-2', data: () => ({ name: 'Bob', xp: 250, level: 5 }) },
        ],
      }),
      doc: (id) => ({ id }),
    }),
  }),
}));

const { getLeaderboardData, syncDatabaseToRedis } =
  await import('../backend/services/leaderboard.service.js');
const { enqueueLeaderboardUpdate } = await import('../backend/jobs/queue.js');

describe('Redis Sorted Set Leaderboard Integration', () => {
  beforeEach(() => {
    mockZcard.mockReset();
    mockZrevrange.mockReset();
    mockZadd.mockReset();
    mockPipeline.mockReset();
    mockGetAll.mockReset();
    mockAddQueue.mockReset();
  });

  describe('Leaderboard Data Retrieval', () => {
    it('should query Redis Sorted Set and return paginated data with details fetched from Firestore', async () => {
      mockZcard.mockResolvedValue(2);
      mockZrevrange.mockResolvedValue(['user-2', '250', 'user-1', '100']);

      mockGetAll.mockResolvedValue([
        {
          id: 'user-1',
          exists: true,
          data: () => ({ name: 'Alice', level: 3, avatar: '{"initial":"A"}' }),
        },
        {
          id: 'user-2',
          exists: true,
          data: () => ({ name: 'Bob', level: 5, avatar: '{"initial":"B"}' }),
        },
      ]);

      const result = await getLeaderboardData({ page: 1, limit: 10 });

      expect(mockZcard).toHaveBeenCalledWith('leaderboard:xp');
      expect(mockZrevrange).toHaveBeenCalledWith('leaderboard:xp', 0, 9, 'WITHSCORES');
      expect(mockGetAll).toHaveBeenCalled();

      expect(result).toEqual({
        totalUsers: 2,
        leaders: [
          {
            id: 'user-2',
            name: 'Bob',
            xp: 250,
            level: 5,
            avatar: '{"initial":"B"}',
            rank: 1,
          },
          {
            id: 'user-1',
            name: 'Alice',
            xp: 100,
            level: 3,
            avatar: '{"initial":"A"}',
            rank: 2,
          },
        ],
      });
    });

    it('should return empty list if Redis card is 0', async () => {
      mockZcard.mockResolvedValue(0);
      const result = await getLeaderboardData({ page: 1, limit: 10 });
      expect(result).toEqual({ leaders: [], totalUsers: 0 });
    });
  });

  describe('Job Enqueuing and Syncing', () => {
    it('should correctly enqueue score updates', async () => {
      await enqueueLeaderboardUpdate('user-abc', 500);
      expect(mockAddQueue).toHaveBeenCalledWith('update-score', { userId: 'user-abc', xp: 500 });
    });

    it('should query Firestore and populate Redis with pipelined ZADD', async () => {
      const mockExec = jest.fn();
      const mockPipelineZadd = jest.fn();
      mockPipeline.mockReturnValue({
        zadd: mockPipelineZadd,
        exec: mockExec,
      });

      mockPipelineZadd.mockReturnThis();

      await syncDatabaseToRedis();

      expect(mockPipeline).toHaveBeenCalled();
      expect(mockPipelineZadd).toHaveBeenCalledWith('leaderboard:xp', 100, 'user-1');
      expect(mockPipelineZadd).toHaveBeenCalledWith('leaderboard:xp', 250, 'user-2');
      expect(mockExec).toHaveBeenCalled();
    });
  });
});
