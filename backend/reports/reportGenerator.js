import puppeteer from 'puppeteer';
import { escapeHtml } from '../../modules/domSanitizer.js';
import { v4 as uuidv4 } from 'uuid';
import { enqueueReport } from '../jobs/queue.js';

// ============================================
// CONFIGURABLE SETTINGS
// ============================================

const BROWSER_CONFIG = {
  IDLE_TIMEOUT: parseInt(process.env.BROWSER_IDLE_TIMEOUT) || 30000,
  MAX_PAGES: parseInt(process.env.BROWSER_MAX_PAGES) || 10,
  PAGE_TIMEOUT: parseInt(process.env.BROWSER_PAGE_TIMEOUT) || 60000,
};

// ============================================
// BROWSER MANAGER CLASS
// ============================================

class BrowserManager {
  constructor() {
    this.browserInstance = null;
    this.isClosing = false;
    this.activePages = 0;
    this.timeoutId = null;
    this.idleTimeout = BROWSER_CONFIG.IDLE_TIMEOUT;
    this.maxPages = BROWSER_CONFIG.MAX_PAGES;
    this.pageTimeout = BROWSER_CONFIG.PAGE_TIMEOUT;
  }

  async getBrowser() {
    if (this.isClosing) {
      throw new Error('Browser is currently closing');
    }

    if (!this.browserInstance) {
      console.log('Launching new browser instance...');
      this.browserInstance = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--disable-extensions',
        ],
        timeout: 30000,
      });

      this.browserInstance.on('disconnected', () => {
        console.log('Browser disconnected');
        this.browserInstance = null;
        this.activePages = 0;
      });
    }

    return this.browserInstance;
  }

  async createPage() {
    if (this.activePages >= this.maxPages) {
      throw new Error(`Max pages (${this.maxPages}) reached`);
    }

    const browser = await this.getBrowser();
    const page = await browser.newPage();
    this.activePages++;
    this.resetIdleTimer();

    page.setDefaultTimeout(this.pageTimeout);
    page.setDefaultNavigationTimeout(this.pageTimeout);

    page._createdAt = Date.now();

    return page;
  }

  async closePage(page) {
    if (!page || page.isClosed()) return;

    try {
      await page.close();
      this.activePages = Math.max(0, this.activePages - 1);
      console.log(`Page closed (${this.activePages} pages active)`);

      if (this.activePages === 0) {
        this.startIdleTimer();
      }
    } catch (error) {
      console.error('Error closing page:', error);
    }
  }

  resetIdleTimer() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  startIdleTimer() {
    this.resetIdleTimer();
    this.timeoutId = setTimeout(async () => {
      if (this.activePages === 0 && this.browserInstance) {
        console.log('Browser idle, closing...');
        await this.closeBrowser();
      }
    }, this.idleTimeout);
  }

  async closeBrowser() {
    if (this.isClosing) return;
    this.isClosing = true;
    this.resetIdleTimer();

    try {
      if (this.browserInstance) {
        console.log('Closing browser instance...');
        await this.browserInstance.close();
        this.browserInstance = null;
        this.activePages = 0;
        console.log('Browser closed successfully');
      }
    } catch (error) {
      console.error('Error closing browser:', error);
    } finally {
      this.isClosing = false;
    }
  }

  async forceClose() {
    console.log('Force closing browser...');

    if (this.browserInstance) {
      try {
        const pages = await this.browserInstance.pages();
        for (const page of pages) {
          if (!page.isClosed()) {
            await page.close();
          }
        }
      } catch (error) {
        // Ignore errors during force close
      }
    }

    await this.closeBrowser();
  }

  isBrowserActive() {
    return this.browserInstance !== null && this.browserInstance.isConnected();
  }

  getStatus() {
    return {
      isConnected: this.isBrowserActive(),
      activePages: this.activePages,
      isClosing: this.isClosing,
      idleTimeout: this.idleTimeout,
      maxPages: this.maxPages,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

const browserManager = new BrowserManager();

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const shutdownHandler = async (signal) => {
  console.log(`\nReceived ${signal}, closing browser...`);
  await browserManager.forceClose();
  process.exit(0);
};

process.on('SIGINT', shutdownHandler);
process.on('SIGTERM', shutdownHandler);
process.on('SIGQUIT', shutdownHandler);

process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  await browserManager.forceClose();
  process.exit(1);
});

// ============================================
// REPORT GENERATION FUNCTIONS
// ============================================

function buildHtmlTemplate(user, _data) {
  const safeName = escapeHtml(user.name);
  const safeEmail = escapeHtml(user.email);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Audit Report - ${safeName}</title>
        <style>
            @media print {
                body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; margin: 0; padding: 20px; }
                h1 { color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 10px; }
                .section { margin-bottom: 20px; }
                .metric { font-weight: bold; }
                .no-print { display: none !important; }
            }
            body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; margin: 0; padding: 40px; }
            h1 { color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 10px; }
            .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .metric { font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>Professional Profile & Audit Report</h1>
        <div class="section">
            <p><span class="metric">Name:</span> ${safeName}</p>
            <p><span class="metric">Email:</span> ${safeEmail}</p>
            <p><span class="metric">Generated At:</span> ${new Date().toLocaleString()}</p>
        </div>
        <div class="section">
            <h2>Summary</h2>
            <p>This document certifies the professional insights and platform activities associated with the user.</p>
        </div>
    </body>
    </html>
  `;
}

export async function generateReportBuffer(session, type) {
  let page = null;
  try {
    page = await browserManager.createPage();
    const mockData = {};
    const html = buildHtmlTemplate(session, mockData);
    await page.setContent(html, { waitUntil: 'networkidle0' });

    if (type === 'pdf') {
      return await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      });
    } else {
      return await page.screenshot({
        type: 'png',
        fullPage: true,
        deviceScaleFactor: 2,
      });
    }
  } finally {
    if (page && !page.isClosed()) {
      await browserManager.closePage(page);
    }
  }
}

export async function handleReportRequest(req, res, pathname, session) {
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  const type = pathname === '/api/reports/export/pdf' ? 'pdf' : 'image';

  try {
    const jobId = uuidv4();
    await enqueueReport(jobId, session, type);

    res.writeHead(202, { 'Content-Type': 'application/json' });
    return res.end(
      JSON.stringify({
        status: 'processing',
        jobId,
        message: 'Report generation started in the background.',
      })
    );
  } catch (error) {
    console.error('Report enqueue error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Failed to enqueue report generation' }));
  }
}

// ============================================
// EXPORTS
// ============================================

export default browserManager;
export { BrowserManager, browserManager, buildHtmlTemplate };
