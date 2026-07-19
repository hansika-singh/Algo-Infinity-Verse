// backend/routes/sqlSimulator.js
import express from 'express';
import { initDB, getDb } from '../services/sqlSimulatorService.js';
import { resetDatabase, executeQuery } from '../controllers/sqlSimulatorController.js';

const router = express.Router();
router.use(express.json());

// DB initialize
try {
  initDB();
} catch (error) {
  console.error("Failed to initialize SQL Simulator database:", error);
}

router.post('/execute', executeQuery);

router.post('/reset', resetDatabase);

export default router;