// backend/routes/thinkingReplayRoutes.js
const express = require('express');
const router = express.Router();
const thinkingReplayController = require('../controllers/thinkingReplayController');

// ✅ Replay route - Already moved in #2281
router.get('/replay/:problemId', thinkingReplayController.getReplay);

// 🔥 UPDATED: Snapshot route - Moved to controller in #2282
router.post('/snapshot', thinkingReplayController.saveSnapshot);

// ⚠️ UNCHANGED: Event route remains inline (For future issues)
router.post('/event', async (req, res) => {
  try {
    const { problemId, type } = req.body;
    const userId = req.user?.id || 'anonymous';
    console.log('Saving event:', { userId, problemId, type });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log event' });
  }
});

module.exports = router;