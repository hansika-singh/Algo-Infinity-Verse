// backend/services/sqlSimulatorService.js
import Database from 'better-sqlite3';

let db;

export function initDB() {
  // Agar pehle se db exist karta hai toh usay clean kar do
  if (db) {
    try { db.close(); } catch (_) { }
  }

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

export function getDb() {
  return db;
}