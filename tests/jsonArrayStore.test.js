import { jest } from '@jest/globals';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

// Avoid Redis during server import.
jest.unstable_mockModule('../backend/jobs/queue.js', () => ({
  enqueueBulkAudit: jest.fn(),
  getBatchProgress: jest.fn(),
  batchStore: new Map(),
  bulkAuditQueue: { add: jest.fn(), on: jest.fn() },
  MAX_BULK_AUDIT_URLS: 50,
  redisAvailable: false,
  redisClient: null,
  redisReady: Promise.resolve(),
  default: {},
}));
jest.unstable_mockModule('../backend/jobs/worker.js', () => ({ default: {} }));

process.env.NODE_ENV = 'test';

const { appendToJsonArrayFile } = await import('../server.js');

describe('appendToJsonArrayFile: serialized, size-capped JSON append (#1217)', () => {
  let filePath;

  beforeEach(async () => {
    filePath = path.join(
      os.tmpdir(),
      `aiv-json-store-${process.pid}-${Math.floor(Math.random() * 1e9)}.json`
    );
    await fs.rm(filePath, { force: true });
  });

  afterEach(async () => {
    await fs.rm(filePath, { force: true });
  });

  it('does not lose entries under concurrent writes (race fix)', async () => {
    const N = 50;
    // Fire all appends concurrently — the old readFile→push→writeFile would
    // interleave and drop most of these.
    await Promise.all(
      Array.from({ length: N }, (_, i) => appendToJsonArrayFile(filePath, { i }, 1000))
    );

    const list = JSON.parse(await fs.readFile(filePath, 'utf8'));
    expect(list).toHaveLength(N);
    // Every value 0..N-1 must be present exactly once (no lost or duplicated writes).
    const seen = new Set(list.map((e) => e.i));
    expect(seen.size).toBe(N);
  });

  it('caps the array to the most recent maxEntries (disk-fill fix)', async () => {
    const cap = 10;
    for (let i = 0; i < cap + 5; i++) {
      await appendToJsonArrayFile(filePath, { i }, cap);
    }

    const list = JSON.parse(await fs.readFile(filePath, 'utf8'));
    expect(list).toHaveLength(cap);
    // Oldest entries dropped; the most recent `cap` remain in order.
    expect(list.map((e) => e.i)).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  it('starts from an empty array when the file does not exist', async () => {
    await appendToJsonArrayFile(filePath, { first: true }, 1000);
    const list = JSON.parse(await fs.readFile(filePath, 'utf8'));
    expect(list).toEqual([{ first: true }]);
  });
});
