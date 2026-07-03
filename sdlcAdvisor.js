import { OpenAI } from "openai";

/**
 * Generate SDLC advice for a given project description.
 * Returns an object with fields: model, sprintLength, timeline, risks, deliverables.
 */
export async function generateSdlcAdvice(description) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set.");
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const systemPrompt = "You are an expert software development consultant. Given a concise project description, provide a JSON object with the following fields:\n- model: recommended SDLC model (e.g., Agile, Waterfall, Spiral)\n- sprintLength: typical sprint length (e.g., '2 weeks') if applicable\n- timeline: estimated total timeline (e.g., '5 months')\n- risks: an array of major risks (max 3 items)\n- deliverables: an array of key deliverables (max 5 items)\nReturn ONLY the JSON object without any additional text.";

  const userPrompt = `Project description: "${description}"`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" }
  });

  const jsonStr = completion.choices[0].message.content;
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse SDLC advice JSON:", e, jsonStr);
    // Fallback generic response
    return {
      model: "Agile",
      sprintLength: "2 weeks",
      timeline: "3-6 months",
      risks: ["Scope creep", "Integration challenges"],
      deliverables: ["Working prototype", "Documentation", "Testing suite"]
    };
  }
}
