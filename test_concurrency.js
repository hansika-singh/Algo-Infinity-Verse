import { processInBatches } from './backend/utils/concurrency.js';
import { fetchBlobsConcurrently } from './backend/repository-analyzer/graphqlFetcher.js';
import IORedis from 'ioredis';
import { Worker } from 'bullmq';
import fs from 'fs/promises';
import path from 'path';

// Override IORedis and Worker connection attempts before importing server.js
IORedis.prototype.connect = function() {
  return Promise.resolve();
};

Worker.prototype.run = function() {
  return Promise.resolve();
};

// Set test environment so server.js doesn't boot immediately
process.env.NODE_ENV = 'test';

const { server } = await import('./server.js');
const { createAccessToken } = await import('./backend/services/auth.service.js');

async function testConcurrencyUtility() {
  void 0;
  const items = Array.from({ length: 20 }, (_, i) => i + 1);
  
  let activeCount = 0;
  let maxActiveCount = 0;

  const asyncTask = async (item, index) => {
    activeCount++;
    if (activeCount > maxActiveCount) {
      maxActiveCount = activeCount;
    }
    
    // Simulate varying work duration
    const delay = Math.random() * 100 + 50;
    await new Promise(res => setTimeout(res, delay));
    
    activeCount--;
    return item * 2;
  };

  const limit = 4;
  const startTime = Date.now();
  const results = await processInBatches(items, asyncTask, limit);
  const duration = Date.now() - startTime;

  void 0;
  void 0;
  
  if (maxActiveCount > limit) {
    throw new Error("Concurrency limit exceeded!");
  }
  
  // Verify ordering
  for (let i = 0; i < items.length; i++) {
    if (results[i] !== items[i] * 2) {
      throw new Error(`Ordering failed at index ${i}. Expected ${items[i] * 2}, got ${results[i]}`);
    }
  }

  void 0;
  void 0;
}

async function testEdgeCases() {
  void 0;

  // Edge Case 1: Empty array
  const emptyRes = await processInBatches([], async () => 1, 5);
  if (emptyRes.length !== 0) throw new Error("Failed Edge Case 1: Empty array should return empty array");
  void 0;

  // Edge Case 2: Array smaller than limit
  const smallRes = await processInBatches([1, 2], async (v) => v * 10, 5);
  if (smallRes.length !== 2 || smallRes[0] !== 10 || smallRes[1] !== 20) throw new Error("Failed Edge Case 2: Array smaller than limit");
  void 0;

  // Edge Case 3: Rejection handling
  try {
    await processInBatches([1, 2, 3], async (v) => {
      if (v === 2) throw new Error("Simulated Failure");
      return v;
    }, 2);
    throw new Error("Failed Edge Case 3: Should have thrown an error");
  } catch (err) {
    if (err.message !== "Simulated Failure") throw new Error("Failed Edge Case 3: Wrong error thrown");
    void 0;
  }

  // Edge Case 4: Synchronous returns / non-promises
  const syncRes = await processInBatches([1, 2, 3], (v) => v + 1, 2);
  if (syncRes[0] !== 2 || syncRes[2] !== 4) throw new Error("Failed Edge Case 4: Synchronous returns");
  void 0;
}

async function testGraphQLFetcher() {
  void 0;
  const filePaths = Array.from({ length: 50 }, (_, i) => `src/file_${i}.js`);
  
  const startTime = Date.now();
  const blobs = await fetchBlobsConcurrently(filePaths, "owner", "repo");
  const duration = Date.now() - startTime;
  
  void 0;
  void 0;
}

async function testMemoryStoreConcurrency() {
  void 0;
  
  // 1. Generate token
  const token = createAccessToken({ id: "test_concurrency_user", name: "Concurrency Tester", email: "test@example.com" });

  // 2. Start server
  const listenPromise = new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });
  const port = await listenPromise;
  const url = `http://127.0.0.1:${port}/api/memory/log`;
  void 0;

  // 3. Setup initial state in MEMORY_FILE
  const DATA_DIR = path.join(process.cwd(), "data");
  const MEMORY_FILE = path.join(DATA_DIR, "memory.json");
  await fs.mkdir(DATA_DIR, { recursive: true });
  // Clean memory file
  await fs.writeFile(MEMORY_FILE, JSON.stringify({}));

  // 4. Send multiple concurrent updates
  const topics = ["React", "Vue", "Angular", "Svelte", "Solid", "Next.js", "Nuxt.js", "Gatsby", "Vite", "Webpack"];
  
  const requests = topics.map(topic => {
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `aiv_session=${token}`
      },
      body: JSON.stringify({ topic, quality: 4 })
    }).then(async r => {
      const text = await r.text();
      if (!r.ok) {
        throw new Error(`Request failed with status ${r.status}: ${text}`);
      }
      return JSON.parse(text);
    });
  });

  await Promise.all(requests);
  void 0;

  // 5. Read MEMORY_FILE and verify it has all topics
  const raw = await fs.readFile(MEMORY_FILE, "utf8");
  const store = JSON.parse(raw);
  
  const userCards = store["test_concurrency_user"];
  if (!userCards) {
    throw new Error("No cards found for test user in memory store!");
  }

  const savedTopics = Object.keys(userCards);
  void 0;

  for (const topic of topics) {
    if (!userCards[topic]) {
      throw new Error(`Topic '${topic}' was lost during concurrent updates!`);
    }
  }

  void 0;

  // 6. Close server
  await new Promise((resolve) => server.close(resolve));
  
  // 7. Cleanup memory file
  try {
    await fs.rm(MEMORY_FILE, { force: true });
  } catch {}
}

async function runTests() {
  try {
    await testConcurrencyUtility();
    await testEdgeCases();
    await testGraphQLFetcher();
    await testMemoryStoreConcurrency();
    void 0;
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

runTests();
