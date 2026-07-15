import IORedis from 'ioredis';
import { Queue } from 'bullmq';

// ── Redis availability check ───────────────────────────────────────────────
// Test once at startup with a short timeout. If Redis isn't running we fall
// back to an in-process queue (bullmq is never instantiated).

export const batchStore = new Map();
export const reportStore = new Map();

let bulkAuditQueue = null;
let reportQueue = null;
let redisAvailable = false;
export let redisClient = null;

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
    redisClient = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
    });
    bulkAuditQueue = new Queue('bulk-audit-queue', { connection: redisClient });
    bulkAuditQueue.on('error', (_err) => {
      void 0;
    });

    reportQueue = new Queue('report-queue', { connection: redisClient });
    reportQueue.on('error', (_err) => {
      void 0;
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

  if (redisAvailable && redisClient && bulkAuditQueue) {
    await redisClient.hmset(`batch:${batchId}`, {
      total: repoUrls.length,
      completed: 0,
      failed: 0,
      results: JSON.stringify([]),
      status: 'processing',
    });
    await redisClient.expire(`batch:${batchId}`, 86400); // 24h expiry

    const jobs = repoUrls.map((url, index) => ({
      name: `audit-${batchId}-${index}`,
      data: { batchId, repoUrl: url },
    }));
    try {
      await bulkAuditQueue.addBulk(jobs);
      return;
    } catch (err) {
      console.error(`Failed to enqueue bulk audit for batch ${batchId}:`, err);
    }
  }

  // ── In-process fallback (no Redis) ───────────────────────────────────────
  batchStore.set(batchId, {
    total: repoUrls.length,
    completed: 0,
    failed: 0,
    results: [],
    status: 'processing',
  });

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
        if (batch) {
          batch.completed += 1;
          batch.results.push({ repoUrl: url, score: bestScore });
        }
      } catch (err) {
        const batch = batchStore.get(batchId);
        if (batch) {
          batch.failed += 1;
          batch.results.push({ repoUrl: url, error: err.message, score: 0 });
        }
      }
    }
  });
}

/**
 * Gets the current progress of a batch.
 */
export async function getBatchProgress(batchId) {
  if (redisAvailable && redisClient) {
    const data = await redisClient.hgetall(`batch:${batchId}`);
    if (!data || Object.keys(data).length === 0) return null;

    const completed = parseInt(data.completed || 0);
    const failed = parseInt(data.failed || 0);
    const total = parseInt(data.total || 0);
    const results = JSON.parse(data.results || '[]');
    const totalProcessed = completed + failed;
    const progress = total > 0 ? Math.round((totalProcessed / total) * 100) : 0;

    let status = data.status;
    if (progress === 100 && status === 'processing') {
      status = 'completed';
      await redisClient.hset(`batch:${batchId}`, 'status', 'completed');
    }

    return { total, completed, failed, results, status, progress };
  }

  // Fallback
  const batch = batchStore.get(batchId);
  if (!batch) return null;

  const totalProcessed = batch.completed + batch.failed;
  const progress = batch.total > 0 ? Math.round((totalProcessed / batch.total) * 100) : 0;

  if (progress === 100) batch.status = 'completed';

  return { ...batch, progress };
}

/**
 * Enqueues a report generation job.
 */
export async function enqueueReport(jobId, session, type) {
  if (redisAvailable && redisClient && reportQueue) {
    await redisClient.hmset(`report:${jobId}`, {
      status: 'processing',
      data: '',
      error: '',
      type: type,
    });
    await redisClient.expire(`report:${jobId}`, 86400); // 24h expiry

    try {
      await reportQueue.add('generate-report', { jobId, session, type });
      return;
    } catch (err) {
      console.error(`Failed to enqueue report generation ${jobId}:`, err);
    }
  }

  // In-process fallback
  reportStore.set(jobId, { status: 'processing', data: null, error: null, type });

  setImmediate(async () => {
    const { generateReportBuffer } = await import('../reports/reportGenerator.js');
    try {
      const buffer = await generateReportBuffer(session, type);
      const report = reportStore.get(jobId);
      if (report) {
        report.status = 'completed';
        report.data = buffer.toString('base64');
      }
    } catch (err) {
      const report = reportStore.get(jobId);
      if (report) {
        report.status = 'failed';
        report.error = err.message;
      }
    }
  });
}

/**
 * Gets the status and result of a report generation job.
 */
export async function getReportStatus(jobId) {
  if (redisAvailable && redisClient) {
    const data = await redisClient.hgetall(`report:${jobId}`);
    if (!data || Object.keys(data).length === 0) return null;
    return {
      status: data.status,
      data: data.data || null,
      error: data.error || null,
      type: data.type || 'pdf',
    };
  }

  // Fallback
  const report = reportStore.get(jobId);
  return report || null;
}

export { bulkAuditQueue, reportQueue, redisAvailable, redisReady };
