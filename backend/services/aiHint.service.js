/**
 * backend/services/aiHint.service.js
 * Context-Aware AI Hint Generator Service with Strict Prompt Guardrails
 */

/**
 * Calls Gemini API to generate a progressive hint based on student's state.
 * Establishes strict pedagogical constraints to prevent direct code solution cheating.
 *
 * @param {Object} params
 * @param {string} params.title - Problem title
 * @param {string} params.description - Problem description
 * @param {number} params.level - Escalated hint level (1: nudge, 2: idea, 3: DS approach, 4: pseudocode)
 * @param {Array<string>} params.previousHints - Already shown hints to build upon
 * @param {string} [params.currentCode] - The user's current code editor text (hidden context)
 * @param {string} [params.tags] - Problem topic tags/context (hidden context)
 * @returns {Promise<string>}
 */
export async function generateAIHint({
  title,
  description,
  level,
  previousHints,
  currentCode,
  tags,
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('AI hints unavailable (GEMINI_API_KEY not set).');
  }

  // Construct context blocks (hidden from the student)
  const codeContext =
    currentCode && currentCode.trim()
      ? `\n\n[STUDENT'S CURRENT CODE STATE]:\n\`\`\`\n${currentCode}\n\`\`\``
      : '';
  const tagsContext = tags && tags.trim() ? `\n[PROBLEM CATEGORY/CONTEXT]: ${tags}` : '';

  // Prompt guardrails
  const systemInstructions =
    `You are a strict, highly pedagogical Data Structures & Algorithms AI tutor. ` +
    `Your goal is to guide the student towards solving the problem "${title}" on their own step-by-step. ` +
    `CRITICAL SAFETY GUARDRAILS:\n` +
    `1. NEVER write, generate, suggest, or correct actual code, code blocks, or full solutions in any programming language (JavaScript, Python, C++, Java, etc.).\n` +
    `2. If the student asks for a code solution or has syntax issues, explain the concept or logic error in plain English without writing the code.\n` +
    `3. You may ONLY offer time/space complexity advice, edge-case checks, high-level structural pseudocode/conceptual steps, or gentle logic nudges.\n` +
    `4. Keep your hints brief and focused (1 to 2 sentences max).\n` +
    `5. Analyze the student's current code state (if provided) and address logical flaws or suggest what to look at next without revealing the actual solution.`;

  const prompt =
    `${systemInstructions}\n` +
    `Problem Title: ${title}` +
    (description ? `\nProblem Description: ${description}` : '') +
    tagsContext +
    codeContext +
    `\n\nHints already shown to the student:\n` +
    (previousHints && previousHints.length
      ? previousHints.map((h, i) => `${i + 1}. ${h}`).join('\n')
      : '(none yet)') +
    `\n\nGenerate Hint #${level} (difficulty escalation) adhering strictly to the safety guardrails.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 200 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API returned status ${response.status}`);
  }

  const result = await response.json();
  const raw = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    throw new Error('No hint content returned from Gemini.');
  }

  // Fail-safe post-processing guardrail check
  const codeMarkers = [
    '```',
    'function ',
    'def ',
    'class ',
    'const ',
    'let ',
    'var ',
    'import ',
    '#include',
    'public class',
    'return ',
  ];

  const containsCode = codeMarkers.some((marker) => raw.includes(marker));
  if (containsCode) {
    // If the model bypassed prompt instructions, return a safe conceptual fallback hint
    return 'Analyze your loop conditions or check if you are handling extreme values (like empty input or large inputs) correctly.';
  }

  return raw.replace(/\*/g, '').replace(/`/g, '').trim();
}
