import express from "express";
import { getCsrfToken, logError, executeCode, executeTracedCode } from "../controllers/apiController.js";
import sqlSimulatorRouter from "./sqlSimulator.js";

const router = express.Router();

router.get("/csrf-token", getCsrfToken);
router.post("/log-error", logError);
router.post("/execute", executeCode);
router.post("/execute/traced", executeTracedCode);
router.use("/sql", sqlSimulatorRouter);

export default router;
