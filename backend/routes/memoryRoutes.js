// backend/routes/memoryRoutes.js
import {
  handleMemoryLog,
  handleMemoryDue,
  handleMemoryAll,
  handleMemoryDelete,
  handleMemoryStats,
  handleMemoryReset,
} from '../handlers/memoryHandlers.js';

/**
 * Memory Routes - Spaced Repetition Learning System
 * All routes are prefixed with /api/memory
 */
export const memoryRoutes = [
  // POST /api/memory/log - Log a memory review with quality (0-5)
  { method: 'POST', path: '/api/memory/log', handler: handleMemoryLog },

  // GET /api/memory/due - Get due cards with pagination
  // Query params: page, limit, sortBy, sortOrder
  { method: 'GET', path: '/api/memory/due', handler: handleMemoryDue },

  // GET /api/memory/all - Get all cards with pagination and filters
  // Query params: page, limit, sortBy, sortOrder, search, filter
  { method: 'GET', path: '/api/memory/all', handler: handleMemoryAll },

  // DELETE /api/memory/:topic - Delete a specific card
  { method: 'DELETE', path: '/api/memory/:topic', handler: handleMemoryDelete },

  // GET /api/memory/stats - Get learning statistics
  { method: 'GET', path: '/api/memory/stats', handler: handleMemoryStats },

  // POST /api/memory/reset - Reset all cards (requires confirmation)
  { method: 'POST', path: '/api/memory/reset', handler: handleMemoryReset },
];

export default memoryRoutes;
