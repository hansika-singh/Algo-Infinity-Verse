import { jest } from '@jest/globals';

const mockGet = jest.fn();
const mockUpdate = jest.fn();

jest.unstable_mockModule('../firebase.js', () => ({
  getDb: () => ({
    collection: () => ({
      doc: () => ({
        get: mockGet,
        update: mockUpdate,
      }),
    }),
  }),
  COLLECTIONS: { USERS: 'users' },
}));

const { getBattle, battleCache } = await import('../pages/Dsa-Battle/Battleservice.js');

describe('getBattle caching optimization', () => {
  beforeEach(() => {
    battleCache.clear();
    mockGet.mockReset();
    mockUpdate.mockReset();
  });

  it('should fetch from database once and cache the result', async () => {
    const battleData = {
      status: 'active',
      expiresAt: { toMillis: () => Date.now() + 60000 },
    };

    mockGet.mockResolvedValue({
      exists: true,
      id: 'lobby123',
      data: () => battleData,
    });

    // First call: Should query DB
    const res1 = await getBattle('lobby123');
    expect(res1.status).toBe('active');
    expect(mockGet).toHaveBeenCalledTimes(1);

    // Second call: Should return from cache, not querying DB
    const res2 = await getBattle('lobby123');
    expect(res2.status).toBe('active');
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('should invalidate cache when battle expires and update status to expired', async () => {
    const battleData = {
      status: 'active',
      expiresAt: { toMillis: () => Date.now() - 1000 }, // already expired
    };

    mockGet.mockResolvedValue({
      exists: true,
      id: 'lobby123',
      data: () => battleData,
    });

    const res = await getBattle('lobby123');
    expect(res.status).toBe('expired');
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'expired' });
  });
});
