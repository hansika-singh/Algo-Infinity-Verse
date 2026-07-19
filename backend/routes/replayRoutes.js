// backend/routes/thinkingReplayRoutes.js
const express = require('express');
const router = express.Router();
const thinkingReplayController = require('../controllers/thinkingReplayController');


router.get('/replay/:problemId', thinkingReplayController.getReplay);


router.post('/snapshot', thinkingReplayController.saveSnapshot);


router.post('/event', thinkingReplayController.logEditorEvent);

module.exports = router;