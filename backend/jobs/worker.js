import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { analyzeWorkflow } from '../repository-analyzer/cicdValidator.js';
import { VCSFactory } from '../vcs/VCSFactory.js';
import { batchStore, redisAvailable, redisReady, redisClient } from './queue.js';

let auditWorker = null;

// The Redis availability probe in queue.js runs asynchronously, so `redisAvailable`
// is still `false` at module-evaluation time. Reading it synchronously here would
// always skip worker creation — even when Redis is up — leaving bulk-audit jobs
// enqueued to Redis but never consumed (they hang at "processing" forever).
// Wait for the probe to settle before deciding whether to start the worker.
async function startWorker() {
  await redisReady;

  if (!redisAvailable) {
    // No Redis: enqueueBulkAudit() runs an in-process fallback, so no worker
    // is needed.
    return null;
  }

  const conn = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null,
  });

  auditWorker = new Worker('bulk-audit-queue', async (job) => {
    const { repoUrl } = job.data;

    let parsedRepoUrl;
    try {
      parsedRepoUrl = new URL(repoUrl);
    } catch {
      throw new Error("Invalid GitHub URL");
    }

    if (
      !['http:', 'https:'].includes(parsedRepoUrl.protocol) ||
      !['github.com', 'www.github.com'].includes(parsedRepoUrl.hostname.toLowerCase())
    ) {
      throw new Error("Invalid GitHub URL");
    }

    try {
      const provider = VCSFactory.getProvider(repoUrl);
      const workflows = await provider.getNormalizedWorkflows();

      let bestScore = 0;
      for (const wf of workflows) {
        const result = analyzeWorkflow(wf.commands);
        if (result.score > bestScore) bestScore = result.score;
      }

      return { repoUrl, score: bestScore };
    } catch (error) {
      console.error(`Job ${job.id} failed for repo ${repoUrl}:`, error.message);
      throw error;
    }
  }, {
    connection: conn,
    concurrency: 5,
  });

  auditWorker.on('error', (_err) => {
    void 0;
  });

  // Event listeners for tracking batch progress
  auditWorker.on('completed', async (job, result) => {
    const { batchId } = job.data;
    if (redisClient) {
      await redisClient.hincrby(`batch:${batchId}`, 'completed', 1);
      const resStr = await redisClient.hget(`batch:${batchId}`, 'results');
      const results = JSON.parse(resStr || '[]');
      results.push(result);
      await redisClient.hset(`batch:${batchId}`, 'results', JSON.stringify(results));
    } else {
      const batch = batchStore.get(batchId);
      if (batch) {
        batch.completed += 1;
        batch.results.push(result);
      }
    }
  });

  auditWorker.on('failed', async (job, err) => {
    const { batchId, repoUrl } = job.data;
    if (redisClient) {
      await redisClient.hincrby(`batch:${batchId}`, 'failed', 1);
      const resStr = await redisClient.hget(`batch:${batchId}`, 'results');
      const results = JSON.parse(resStr || '[]');
      results.push({ repoUrl, error: err.message, score: 0 });
      await redisClient.hset(`batch:${batchId}`, 'results', JSON.stringify(results));
    } else {
      const batch = batchStore.get(batchId);
      if (batch) {
        batch.failed += 1;
        batch.results.push({ repoUrl, error: err.message, score: 0 });
      }
    }
  });

  void 0;
  return auditWorker;
}

// Kick off worker startup as a module side effect. Errors are swallowed so a
// Redis hiccup at boot doesn't crash the importing process; jobs fall back to
// the in-process path in queue.js.
const workerReady = startWorker().catch((_err) => {
  void 0;
  return null;
});

export { auditWorker, startWorker, workerReady };
