import multer from "multer";
import { sendJson, getSession } from "../utils/helpers.js";
import { extractResumeText } from "../resume-analyzer/parser.js";
import { calculateATS } from "../resume-analyzer/atsScore.js";
import { findMissingSkills } from "../resume-analyzer/skills.js";
import { getSuggestions } from "../resume-analyzer/suggestions.js";
import { applyRateLimit, resumeAnalysisLimiter } from "../utils/rateLimiter.js";

const MAX_RESUME_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_FILE_SIZE_BYTES, files: 1 },
}).single("resume");

export async function handleAnalyzeResume(req, res) {
  // Auth check — parsing an uploaded file is expensive work and must not be
  // reachable anonymously.
  const session = getSession(req);
  if (!session) {
    return sendJson(res, 401, { error: "Login required." });
  }

  try {
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (!req.file) {
      return sendJson(res, 400, { error: "No resume file uploaded." });
    }

    const text = await extractResumeText(req.file);
    const atsScore = calculateATS(text);
    const missingSkills = findMissingSkills(text);
    const suggestions = getSuggestions(atsScore);

    return sendJson(res, 200, {
      atsScore,
      missingSkills,
      suggestions,
    });
  } catch (error) {
    console.error("Resume analysis error:", error);
    return sendJson(res, 500, { error: error.message || "Failed to analyze resume." });
  }
}