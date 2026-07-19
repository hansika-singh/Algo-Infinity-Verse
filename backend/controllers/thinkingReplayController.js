// backend/controllers/thinkingReplayController.js
const ThinkingReplayService = require('../services/thinkingReplayService');


async function saveEditorEvent(data) {

  console.log('Saving event:', data);
}


exports.logEditorEvent = async (req, res) => {
  try {
    const { problemId, type } = req.body;
    const userId = req.user?.id || 'anonymous';

    await saveEditorEvent({ userId, problemId, type });

    res.json({ success: true });
  } catch (error) {
    console.error('Event logging error:', error);
    res.status(500).json({ error: 'Failed to log event' });
  }
};