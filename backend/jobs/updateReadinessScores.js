import { calculateReadinessScore } from '../services/readinessEngine.js';

// ============================================
// CONFIGURABLE BATCH SETTINGS
// ============================================

const BATCH_CONFIG = {
  BATCH_SIZE: parseInt(process.env.USER_BATCH_SIZE) || 100,
  BATCH_DELAY_MS: parseInt(process.env.BATCH_DELAY_MS) || 100,
  MAX_RETRIES: parseInt(process.env.BATCH_MAX_RETRIES) || 3,
  PROGRESS_REPORT_INTERVAL: parseInt(process.env.PROGRESS_REPORT_INTERVAL) || 50,
  USER_TIMEOUT_MS: parseInt(process.env.USER_TIMEOUT_MS) || 30000,
};

// ============================================
// BATCH PROCESSOR CLASS
// ============================================

class BatchProcessor {
  constructor(config = {}) {
    this.batchSize = config.batchSize || BATCH_CONFIG.BATCH_SIZE;
    this.batchDelay = config.batchDelay || BATCH_CONFIG.BATCH_DELAY_MS;
    this.maxRetries = config.maxRetries || BATCH_CONFIG.MAX_RETRIES;
    this.progressInterval = config.progressInterval || BATCH_CONFIG.PROGRESS_REPORT_INTERVAL;
    this.userTimeout = config.userTimeout || BATCH_CONFIG.USER_TIMEOUT_MS;
    
    this.processedCount = 0;
    this.failedCount = 0;
    this.successCount = 0;
    this.startTime = null;
    this.batchNumber = 0;
    this.failedUsers = [];
  }

  async processInBatches(users, processFn) {
    this.startTime = Date.now();
    this.processedCount = 0;
    this.failedCount = 0;
    this.successCount = 0;
    this.batchNumber = 0;
    this.failedUsers = [];

    const totalUsers = users.length;
    
    if (totalUsers === 0) {
      console.log('No users to process');
      return this.getFinalReport(totalUsers);
    }

    console.log(`Starting batch processing: ${totalUsers} users in batches of ${this.batchSize}`);
    console.log(`Config: Retries=${this.maxRetries}, Delay=${this.batchDelay}ms, Timeout=${this.userTimeout}ms`);

    for (let i = 0; i < totalUsers; i += this.batchSize) {
      this.batchNumber++;
      const batchStart = i;
      const batchEnd = Math.min(i + this.batchSize, totalUsers);
      const batch = users.slice(batchStart, batchEnd);

      console.log(`\nBatch ${this.batchNumber}: Processing ${batch.length} users (${batchStart + 1}-${batchEnd}/${totalUsers})`);

      await this.processBatchWithRetry(batch, processFn, this.batchNumber);

      if (this.processedCount % this.progressInterval < this.batchSize || 
          this.processedCount === totalUsers) {
        this.reportProgress(totalUsers);
      }

      if (i + this.batchSize < totalUsers) {
        await this.delay(this.batchDelay);
      }
    }

    return this.getFinalReport(totalUsers);
  }

  async processBatchWithRetry(batch, processFn, batchNumber) {
    let attempts = 0;
    let lastError = null;

    while (attempts < this.maxRetries) {
      try {
        const results = await Promise.allSettled(
          batch.map((user, index) => 
            this.processUserWithTimeout(processFn, user, this.userTimeout, batchNumber, index)
          )
        );

        results.forEach((result, index) => {
          const user = batch[index];
          if (result.status === 'fulfilled') {
            this.successCount++;
            console.log(`User ${user.id || user.name} processed successfully`);
          } else {
            this.failedCount++;
            this.failedUsers.push({
              userId: user.id || user.name,
              error: result.reason?.message || 'Unknown error'
            });
            console.log(`User ${user.id || user.name} failed: ${result.reason?.message || 'Unknown error'}`);
          }
        });

        this.processedCount += batch.length;
        return;
      } catch (error) {
        attempts++;
        lastError = error;
        console.warn(`Batch ${batchNumber} failed (attempt ${attempts}/${this.maxRetries}): ${error.message}`);
        
        if (attempts < this.maxRetries) {
          const waitTime = 1000 * Math.pow(2, attempts - 1);
          console.log(`Waiting ${waitTime}ms before retry...`);
          await this.delay(waitTime);
        }
      }
    }

    console.error(`Batch ${batchNumber} failed after ${this.maxRetries} attempts`);
    batch.forEach(user => {
      this.failedCount++;
      this.failedUsers.push({
        userId: user.id || user.name,
        error: `Batch failed after ${this.maxRetries} retries: ${lastError?.message || 'Unknown error'}`
      });
    });
    this.processedCount += batch.length;
  }

  async processUserWithTimeout(processFn, user, timeoutMs, batchNumber, index) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout: User ${user.id || user.name} took more than ${timeoutMs}ms`));
      }, timeoutMs);

      Promise.resolve(processFn(user))
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeoutId));
    });
  }

  reportProgress(totalUsers) {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = elapsed > 0 ? Math.round(this.processedCount / elapsed) : 0;
    const remaining = totalUsers - this.processedCount;
    const eta = rate > 0 ? Math.round(remaining / rate) : 0;

    const percentComplete = Math.round((this.processedCount / totalUsers) * 100);
    const successRate = this.processedCount > 0 
      ? Math.round((this.successCount / this.processedCount) * 100) 
      : 0;

    console.log(`\nProgress: ${this.processedCount}/${totalUsers} (${percentComplete}%)`);
    console.log(`Success: ${this.successCount} | Failed: ${this.failedCount} (${successRate}% success rate)`);
    console.log(`Speed: ${rate} users/sec | ETA: ${eta}s`);
  }

  getFinalReport(totalUsers) {
    const duration = (Date.now() - this.startTime) / 1000;
    const successRate = this.processedCount > 0 
      ? Math.round((this.successCount / this.processedCount) * 100) 
      : 0;

    const report = {
      totalUsers,
      processed: this.processedCount,
      success: this.successCount,
      failed: this.failedCount,
      successRate,
      duration: Math.round(duration),
      averageSpeed: this.processedCount > 0 ? Math.round(this.processedCount / duration) : 0,
      failedUsers: this.failedUsers.slice(0, 10)
    };

    console.log(`\n${'='.repeat(60)}`);
    console.log(`BATCH PROCESSING COMPLETE`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Successfully processed: ${report.success}/${report.totalUsers} users (${report.successRate}%)`);
    console.log(`Failed: ${report.failed} users`);
    console.log(`Duration: ${report.duration}s | Speed: ${report.averageSpeed} users/sec`);
    console.log(`${'='.repeat(60)}`);

    if (report.failedUsers.length > 0) {
      console.log(`\nFailed Users (showing first 10):`);
      report.failedUsers.forEach((user, i) => {
        console.log(`   ${i + 1}. User ${user.userId}: ${user.error}`);
      });
      if (report.failedUsers.length > 10) {
        console.log(`   ... and ${report.failedUsers.length - 10} more failures`);
      }
    }

    return report;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================
// MAIN BACKGROUND JOB FUNCTION
// ============================================

/**
 * Background job to process and update interview readiness scores for users
 * Processes users in configurable batches for better performance
 */
export async function processUserReadinessScores(options = {}) {
  console.log('Starting user readiness score processing job...');
  console.log(new Date().toISOString());

  try {
    // 1. Fetch users who need their scores updated
    // const users = await db.User.findAll({ active: true });
    
    const mockUsers = [
      { id: 1, name: "Alice", quizPerformance: 75, problemsSolved: 20, coveredTopics: ['DSA'] },
      { id: 2, name: "Bob", quizPerformance: 90, problemsSolved: 60, coveredTopics: ['DSA', 'System Design'] },
      { id: 3, name: "Charlie", quizPerformance: 45, problemsSolved: 5, coveredTopics: ['DSA'] },
      { id: 4, name: "David", quizPerformance: 85, problemsSolved: 45, coveredTopics: ['DSA', 'System Design'] },
      { id: 5, name: "Eve", quizPerformance: 95, problemsSolved: 80, coveredTopics: ['DSA', 'System Design', 'Algorithms'] },
      { id: 6, name: "Frank", quizPerformance: 60, problemsSolved: 30, coveredTopics: ['DSA'] },
      { id: 7, name: "Grace", quizPerformance: 70, problemsSolved: 35, coveredTopics: ['System Design'] },
      { id: 8, name: "Henry", quizPerformance: 88, problemsSolved: 55, coveredTopics: ['DSA', 'Algorithms'] },
      { id: 9, name: "Ivy", quizPerformance: 50, problemsSolved: 10, coveredTopics: ['DSA'] },
      { id: 10, name: "Jack", quizPerformance: 92, problemsSolved: 70, coveredTopics: ['DSA', 'System Design', 'Algorithms'] }
    ];

    const generateMoreUsers = options.generateMockData || false;
    let users = mockUsers;
    if (generateMoreUsers) {
      for (let i = 11; i <= 150; i++) {
        users.push({
          id: i,
          name: `User${i}`,
          quizPerformance: Math.floor(Math.random() * 100),
          problemsSolved: Math.floor(Math.random() * 80),
          coveredTopics: ['DSA', 'System Design', 'Algorithms'].slice(0, Math.floor(Math.random() * 3) + 1)
        });
      }
    }

    console.log(`Found ${users.length} users to process`);

    // 2. Define the processing function
    const processUser = async (user) => {
      try {
        const analytics = calculateReadinessScore(user);
        
        // Save the computed metrics back to the database
        // await db.ReadinessDashboard.upsert({
        //   userId: user.id,
        //   score: analytics.overallPercentage,
        //   breakdown: JSON.stringify(analytics.breakdown),
        //   suggestions: JSON.stringify(analytics.suggestions),
        //   missingTopics: JSON.stringify(analytics.missingTopics),
        //   updatedAt: new Date()
        // });

        console.log(`User ${user.id} (${user.name}): Score = ${analytics.overallPercentage}%`);
        
        return {
          userId: user.id,
          name: user.name,
          score: analytics.overallPercentage,
          breakdown: analytics.breakdown,
          suggestions: analytics.suggestions
        };
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        throw error;
      }
    };

    // 3. Process users in batches
    const processor = new BatchProcessor({
      batchSize: options.batchSize || BATCH_CONFIG.BATCH_SIZE,
      batchDelay: options.batchDelay || BATCH_CONFIG.BATCH_DELAY_MS,
      maxRetries: options.maxRetries || BATCH_CONFIG.MAX_RETRIES,
      progressInterval: options.progressInterval || BATCH_CONFIG.PROGRESS_REPORT_INTERVAL,
      userTimeout: options.userTimeout || BATCH_CONFIG.USER_TIMEOUT_MS
    });

    const results = await processor.processInBatches(users, processUser);

    console.log('\nUser readiness score processing job completed');
    return results;

  } catch (error) {
    console.error('Error running readiness score job:', error);
    throw error;
  }
}

// ============================================
// EXPORTS
// ============================================

export default processUserReadinessScores;
export { BatchProcessor, BATCH_CONFIG };