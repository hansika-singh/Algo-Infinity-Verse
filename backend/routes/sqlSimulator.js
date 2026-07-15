// backend/routes/sqlSimulator.js
import express from 'express';
import { initDB, getDb } from '../services/sqlSimulatorService.js';
import { resetDatabase } from '../controllers/sqlSimulatorController.js';

const router = express.Router();
router.use(express.json());

// DB initialize kar do
try {
  initDB();
} catch (error) {
  console.error("Failed to initialize SQL Simulator database:", error);
}

// ⚠️ UNCHANGED: Execute route
router.post('/execute', (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'SQL query is required' });
  }

  try {
    const db = getDb();
    const isSelect = query.trim().toUpperCase().startsWith('SELECT') || query.trim().toUpperCase().startsWith('PRAGMA');
    if (isSelect) {
      const stmt = db.prepare(query);
      const results = stmt.all();
      return res.json({ success: true, results });
    } else {
      const stmt = db.prepare(query);
      const info = stmt.run();
      return res.json({ success: true, info });
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

router.post('/reset', resetDatabase);

export default router;