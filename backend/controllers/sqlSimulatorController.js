// backend/controllers/sqlSimulatorController.js
import { getDb } from '../services/sqlSimulatorService.js';

export const resetDatabase = (req, res) => {
  try {
    const db = getDb();
    db.exec(`DROP TABLE IF EXISTS employees;`);
    initDB();
    return res.json({ success: true, message: 'Database reset successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const executeQuery = (req, res) => {
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
};