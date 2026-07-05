import { jest } from '@jest/globals';

// Set test environment
process.env.NODE_ENV = 'test';

// Define the mocks in a shared scope so we can reference them
const overrides = {
  mkdir: jest.fn().mockResolvedValue(undefined),
  access: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('{}'),
  writeFile: jest.fn().mockResolvedValue(undefined),
  rename: jest.fn().mockResolvedValue(undefined),
};

jest.unstable_mockModule('fs/promises', () => {
  const actual = jest.requireActual('fs/promises');
  
  const handler = {
    get(target, prop) {
      if (prop === 'default') return proxy;
      if (prop in overrides) return overrides[prop];
      return target[prop];
    },
    ownKeys(target) {
      const keys = Reflect.ownKeys(target);
      if (!keys.includes('default')) {
        keys.push('default');
      }
      return keys;
    },
    getOwnPropertyDescriptor(target, prop) {
      if (prop === 'default') {
        return {
          configurable: true,
          enumerable: true,
          value: proxy,
          writable: true,
        };
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    }
  };

  const proxy = new Proxy(actual, handler);
  return proxy;
});

// Mock backend/jobs queue & worker to avoid Redis issues during import
jest.unstable_mockModule('../backend/jobs/queue.js', () => ({
  enqueueBulkAudit: jest.fn(),
  getBatchProgress: jest.fn(),
  MAX_BULK_AUDIT_URLS: 50,
  batchStore: new Map(),
  bulkAuditQueue: {
    add: jest.fn(),
    on: jest.fn(),
  },
  default: {}
}));

jest.unstable_mockModule('../backend/jobs/worker.js', () => ({
  default: {}
}));

// Static imports will receive the mocked modules
import fs from 'fs/promises';
const { updateMemoryStore } = await import('../server.js');

describe('updateMemoryStore atomicity and mutator behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset default mock implementations
    overrides.mkdir.mockResolvedValue(undefined);
    overrides.access.mockResolvedValue(undefined);
    overrides.readFile.mockResolvedValue('{}');
    overrides.writeFile.mockResolvedValue(undefined);
    overrides.rename.mockResolvedValue(undefined);
  });

  it('should write the mutated store when mutator mutates in-place and returns undefined', async () => {
    const originalStore = { user1: { card1: { topic: 'React', interval: 1 } } };
    overrides.readFile.mockResolvedValueOnce(JSON.stringify(originalStore));

    const mutator = (store) => {
      store.user1.card1.interval = 5;
      // returns undefined
    };

    const result = await updateMemoryStore(mutator);

    expect(result).toBeUndefined();
    expect(overrides.writeFile).toHaveBeenCalled();
    const writeArgs = overrides.writeFile.mock.calls[0];
    const writtenContent = JSON.parse(writeArgs[1]);
    expect(writtenContent.user1.card1.interval).toBe(5);
  });

  it('should write the mutated store when mutator mutates in-place and returns a card object', async () => {
    const originalStore = { user1: { card1: { topic: 'React', interval: 1 } } };
    overrides.readFile.mockResolvedValueOnce(JSON.stringify(originalStore));

    const mutator = (store) => {
      store.user1.card1.interval = 5;
      return store.user1.card1; // returns a card object
    };

    const result = await updateMemoryStore(mutator);

    expect(result).toEqual({ topic: 'React', interval: 5 });
    expect(overrides.writeFile).toHaveBeenCalled();
    const writeArgs = overrides.writeFile.mock.calls[0];
    const writtenContent = JSON.parse(writeArgs[1]);
    // The entire store (not just the card) should be written to the file
    expect(writtenContent).toEqual({ user1: { card1: { topic: 'React', interval: 5 } } });
  });

  it('should write the new store when mutator returns a brand new store object (non-in-place mutation)', async () => {
    const originalStore = { user1: { card1: { topic: 'React', interval: 1 } } };
    overrides.readFile.mockResolvedValueOnce(JSON.stringify(originalStore));

    const newStore = { user1: { card1: { topic: 'React', interval: 10 } }, user2: {} };
    const mutator = (store) => {
      return newStore; // returns a new store object
    };

    const result = await updateMemoryStore(mutator);

    expect(result).toBe(newStore);
    expect(overrides.writeFile).toHaveBeenCalled();
    const writeArgs = overrides.writeFile.mock.calls[0];
    const writtenContent = JSON.parse(writeArgs[1]);
    // The new store object should be written to the file
    expect(writtenContent).toEqual(newStore);
  });
});
