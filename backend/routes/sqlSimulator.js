import express from 'express';
import Database from 'better-sqlite3';

const router = express.Router();
router.use(express.json());

let db;
function initDB() {
  db = new Database(':memory:');
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      salary INTEGER NOT NULL
    );
    INSERT INTO employees (name, department, salary) VALUES ('Alice', 'Engineering', 90000);
    INSERT INTO employees (name, department, salary) VALUES ('Bob', 'HR', 60000);
    INSERT INTO employees (name, department, salary) VALUES ('Charlie', 'Engineering', 95000);
    INSERT INTO employees (name, department, salary) VALUES ('Diana', 'Marketing', 70000);
  `);
}

try {
  initDB();
} catch (error) {
  console.error("Failed to initialize SQL Simulator database:", error);
}

router.post('/execute', (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'SQL query is required' });
  }

  try {
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

router.post('/reset', (req, res) => {
  try {
    db.exec(`DROP TABLE IF EXISTS employees;`);
    initDB();
    return res.json({ success: true, message: 'Database reset successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
