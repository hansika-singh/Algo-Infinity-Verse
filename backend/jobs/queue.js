import IORedis from 'ioredis';
import { Queue } from 'bullmq';

// ── Redis availability check ───────────────────────────────────────────────
// Test once at startup with a short timeout. If Redis isn't running we fall
// back to an in-process queue (bullmq is never instantiated).

export const batchStore = new Map();

let bulkAuditQueue = null;
let redisAvailable = false;

async function checkRedis() {
  const probe = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: 1,
    connectTimeout: 1000,
    retryStrategy: () => null,
    enableOfflineQueue: false,
  });
  probe.on('error', () => {});

  try {
    await probe.ping();
    redisAvailable = true;
    const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    });
    bulkAuditQueue = new Queue('bulk-audit-queue', { connection });
    bulkAuditQueue.on('error', (err) => {
      console.warn('Queue Redis Connection Error:', err.message);
    });
  } catch {
    redisAvailable = false;
  } finally {
    probe.disconnect();
  }
}

// Perform checking asynchronously. Consumers (e.g. the worker) must await this
// promise before reading `redisAvailable`, otherwise they observe the initial
// `false` value before the probe has resolved.
const redisReady = checkRedis().catch(() => {});

// Hard cap on repositories processed per bulk audit. Each URL fans out to one
// or more outbound GitHub requests, so an unbounded list is an unauthenticated
// denial-of-service / cost-amplification vector. Callers should reject larger
// batches up front; this slice is a defense-in-depth backstop for any caller.
export const MAX_BULK_AUDIT_URLS = 50;

/**
 * Enqueues a batch of repositories for analysis.
 */
export async function enqueueBulkAudit(batchId, repoUrls) {
  // Defensive cap so a direct caller can never enqueue an unbounded batch.
  repoUrls = repoUrls.slice(0, MAX_BULK_AUDIT_URLS);

  batchStore.set(batchId, {
    total: repoUrls.length,
    completed: 0,
    failed: 0,
    results: [],
    status: 'processing'
  });

  if (redisAvailable && bulkAuditQueue) {
    const jobs = repoUrls.map((url, index) => ({
      name: `audit-${batchId}-${index}`,
      data: { batchId, repoUrl: url }
    }));
    try {
      await bulkAuditQueue.addBulk(jobs);
      return;
    } catch (err) {
      console.warn("Bulk add to Redis failed. Falling back to in-process.");
    }
  }

  // ── In-process fallback (no Redis) ───────────────────────────────────────
  setImmediate(async () => {
    const { analyzeWorkflow } = await import('../repository-analyzer/cicdValidator.js');
    const { VCSFactory } = await import('../vcs/VCSFactory.js');
    for (const url of repoUrls) {
      try {
        const provider = VCSFactory.getProvider(url);
        const workflows = await provider.getNormalizedWorkflows();
        let bestScore = 0;
        for (const wf of workflows) {
          const result = analyzeWorkflow(wf.commands);
          if (result.score > bestScore) bestScore = result.score;
        }
        const batch = batchStore.get(batchId);
        if (batch) { batch.completed += 1; batch.results.push({ repoUrl: url, score: bestScore }); }
      } catch (err) {
        const batch = batchStore.get(batchId);
        if (batch) { batch.failed += 1; batch.results.push({ repoUrl: url, error: err.message, score: 0 }); }
      }
    }
  });
}

/**
 * Gets the current progress of a batch.
 */
export function getBatchProgress(batchId) {
  const batch = batchStore.get(batchId);
  if (!batch) return null;

  const totalProcessed = batch.completed + batch.failed;
  const progress = batch.total > 0 ? Math.round((totalProcessed / batch.total) * 100) : 0;

  if (progress === 100) batch.status = 'completed';

  return { ...batch, progress };
}

export { bulkAuditQueue, redisAvailable, redisReady };
