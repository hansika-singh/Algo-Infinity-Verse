// backend/controllers/sqlSimulatorController.js
import { initDB, getDb } from '../services/sqlSimulatorService.js';

/**
 * Resets the SQL simulator database to its initial seeded state.
 *
 * `@param` {import('express').Request} req - The Express request object.
 * `@param` {import('express').Response} res - The Express response object.
 */
export const resetDatabase = (req, res) => {
  try {
    initDB();
    return res.json({ success: true, message: 'Database reset successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};