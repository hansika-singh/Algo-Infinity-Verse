// backend/controllers/thinkingReplayController.js
const ThinkingReplayService = require('../services/thinkingReplayService');

// --- (Existing helper functions for getReplay and saveSnapshot - waisa hi rahega) ---

// 🔥 ISSUE #2283: Editor event helper moved here
async function saveEditorEvent(data) {
  // Replace this with actual DB query in the future
  console.log('Saving event:', data);
}

// 🔥 ISSUE #2283: Editor event logging logic moved here
exports.logEditorEvent = async (req, res) => {
  try {
    const { problemId, type } = req.body;
    if (!problemId || !type) {
      return res.status(400).json({ error: 'problemId and type are required' });
    }
    const userId = req.user?.id || 'anonymous';

    await saveEditorEvent({ userId, problemId, type });

    res.json({ success: true });
  } catch (error) {
    console.error('Event logging error:', error);
    res.status(500).json({ error: 'Failed to log event' });
// --- (Existing helper functions for getReplay - waisa hi rahega) ---

// 🔥 ISSUE #2282: Snapshot helper moved here
async function saveSnapshot(data) {
  // Replace this with actual DB query in the future
  console.log('Saving snapshot:', data);
}

// 🔥 ISSUE #2282: Snapshot creation logic moved here
exports.saveSnapshot = async (req, res) => {
  try {
    const { problemId, code, status, executionTime, errors } = req.body;
    const userId = req.user?.id || 'anonymous';

    await saveSnapshot({ userId, problemId, code, status, executionTime, errors });

    res.json({ success: true, message: 'Snapshot saved' });
  } catch (error) {
    console.error('Snapshot error:', error);
    res.status(500).json({ error: 'Failed to save snapshot' });
// Helper functions (replace with actual DB queries)
async function getSnapshots(_userId, _problemId) {
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

async function getEditorEvents(_userId, _problemId) {
  return [
    { type: 'typing', timestamp: new Date(Date.now() - 300000) },
    { type: 'typing', timestamp: new Date(Date.now() - 280000) },
    { type: 'run', timestamp: new Date(Date.now() - 250000) }
  ];
}

async function getSubmissions(_userId, _problemId) {
  return [
    { status: 'failed', timestamp: new Date(Date.now() - 200000) },
    { status: 'accepted', timestamp: new Date(Date.now() - 60000) }
  ];
}

// 🔥 ISSUE #2281: Replay generation logic moved here
exports.getReplay = async (req, res) => {
  try {
    const { problemId } = req.params;
    const userId = req.user?.id || 'anonymous';

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
};