import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { analyzeWorkflow } from '../repository-analyzer/cicdValidator.js';
import { VCSFactory } from '../vcs/VCSFactory.js';
import { batchStore, redisAvailable, redisReady } from './queue.js';

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
    const { batchId, repoUrl } = job.data;

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

  auditWorker.on('error', (err) => {
    console.warn('Worker Redis Connection Error:', err.message);
  });

  // Event listeners for tracking batch progress
  auditWorker.on('completed', (job, result) => {
    const { batchId } = job.data;
    const batch = batchStore.get(batchId);
    if (batch) {
      batch.completed += 1;
      batch.results.push(result);
    }
  });

  auditWorker.on('failed', (job, err) => {
    const { batchId } = job.data;
    const batch = batchStore.get(batchId);
    if (batch) {
      batch.failed += 1;
      batch.results.push({ repoUrl: job.data.repoUrl, error: err.message, score: 0 });
    }
  });

  console.log('Background Audit Worker started and listening for jobs...');
  return auditWorker;
}

// Kick off worker startup as a module side effect. Errors are swallowed so a
// Redis hiccup at boot doesn't crash the importing process; jobs fall back to
// the in-process path in queue.js.
const workerReady = startWorker().catch((err) => {
  console.warn('Failed to start Background Audit Worker:', err.message);
  return null;
});

export { auditWorker, startWorker, workerReady };
