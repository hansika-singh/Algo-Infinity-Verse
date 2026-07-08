const express = require('express');
const router = express.Router();
const ThinkingReplayService = require('../services/thinkingReplayService');

// Get replay for a problem
router.get('/replay/:problemId', async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user?.id || 'anonymous';
    
    // Fetch data from database
    const snapshots = await getSnapshots(userId, problemId);
    const events = await getEditorEvents(userId, problemId);
    const submissions = await getSubmissions(userId, problemId);
    
    if (!snapshots || snapshots.length < 2) {
      return res.status(404).json({
        error: 'Not enough data to generate replay',
        message: 'Make more attempts to generate replay'
      });
    }
    
    const service = new ThinkingReplayService();
    const replay = await service.generateReplay(snapshots, events, submissions);
    
    res.json({
      success: true,
      data: replay
    });
  } catch (error) {
    console.error('Replay error:', error);
    res.status(500).json({ error: 'Failed to generate replay' });
  }
});

// Save snapshot
router.post('/snapshot', async (req, res) => {
  try {
    const { problemId, code, status, executionTime, errors } = req.body;
    const userId = req.user?.id || 'anonymous';
    
    // Save snapshot to database
    await saveSnapshot({ userId, problemId, code, status, executionTime, errors });
    
    res.json({ success: true, message: 'Snapshot saved' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

// Log editor event
router.post('/event', async (req, res) => {
  try {
    const { problemId, type } = req.body;
    const userId = req.user?.id || 'anonymous';
    
    await saveEditorEvent({ userId, problemId, type });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log event' });
  }
});

// Helper functions (replace with actual DB queries)
async function getSnapshots(userId, problemId) {
  // Return sample data for now
  return [
    {
      timestamp: new Date(Date.now() - 300000).toISOString(),
      code: 'function solve(arr) { return arr; }',
      status: 'submitted',
      executionTime: 1500,
      errors: null
    },
    {
      timestamp: new Date(Date.now() - 180000).toISOString(),
      code: 'function solve(arr) { return arr.sort(); }',
      status: 'submitted',
      executionTime: 500,
      errors: null
    },
    {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      code: 'function solve(arr) { return arr.sort((a,b) => a-b); }',
      status: 'accepted',
      executionTime: 100,
      errors: null
    }
  ];
}

async function getEditorEvents(userId, problemId) {
  return [
    { type: 'typing', timestamp: new Date(Date.now() - 300000) },
    { type: 'typing', timestamp: new Date(Date.now() - 280000) },
    { type: 'run', timestamp: new Date(Date.now() - 250000) }
  ];
}

async function getSubmissions(userId, problemId) {
  return [
    { status: 'failed', timestamp: new Date(Date.now() - 200000) },
    { status: 'accepted', timestamp: new Date(Date.now() - 60000) }
  ];
}

async function saveSnapshot(data) {
  console.log('Saving snapshot:', data);
}

async function saveEditorEvent(data) {
  console.log('Saving event:', data);
}

module.exports = router;