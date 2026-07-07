import express from "express";
import { getCsrfToken, logError, executeCode, executeTracedCode } from "../controllers/apiController.js";

const router = express.Router();

router.get("/csrf-token", getCsrfToken);
router.post("/log-error", logError);
router.post("/execute", executeCode);
router.post("/execute/traced", executeTracedCode);

export default router;
