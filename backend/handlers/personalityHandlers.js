import { sendJson, getSession } from "../utils/helpers.js";
import { CodingPersonalityAnalyzer } from "../personalityAnalyzer.js";

export async function handleUserPersonality(req, res) {
  try {
    const session = getSession(req);

    if (!session) {
      return sendJson(res, 401, { error: "User not authenticated" });
    }

    // Get user data - replace with actual DB fetch
    const userData = {
      problems: [],
      submissions: [],
      topics: [],
      streak: 0,
    };

    const analyzer = new CodingPersonalityAnalyzer(userData);
    const personality = analyzer.analyze();

    return sendJson(res, 200, {
      success: true,
      data: personality,
    });
  } catch (error) {
    console.error("Personality analysis error:", error);
    return sendJson(res, 500, { error: "Failed to analyze personality" });
  }
}
