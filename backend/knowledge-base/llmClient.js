// backend/knowledge-base/llmClient.js
// Stub LLM client for embedding generation and markdown creation.
// Replace with real LLM integration (Docker container running Llama 3.1) later.

const crypto = require('crypto');


// Deterministic pseudo‑random embedding from text (placeholder).
function getEmbedding(text) {
  const hash = crypto.createHash('sha256').update(text).digest('hex');
  const dim = 128; // dimension for prototype
  const vector = [];
  for (let i = 0; i < dim; i++) {
    const byte = parseInt(hash.substr((i * 2) % hash.length, 2), 16);
    vector.push(byte / 255);
  }
  return vector;
}

// Simple markdown generator – real implementation would call LLM.
function generateTopicMarkdown(topic, snippets) {
  const sections = [
    `# ${topic}`,
    '## Definition\n> _Auto‑generated definition._',
    '## Core Intuition\n> _Intuition description._',
    '## Time & Space Complexity\n> _Complexity details._',
    '## Algorithms & Related Data Structures\n> _List algorithms and data structures._',
    '## Frequently Made Mistakes\n> _Common pitfalls._',
    "## User's Accepted Solutions\n> _User solutions will appear here._",
    '## AI‑Generated Optimized Solution\n> _Optimized solution placeholder._',
    '## Flashcards\n> _Flashcard content._',
    '## Interview Questions\n> _Sample interview questions._',
    '## Related Problems\n> _Links to related problems._',
    '## Revision Timeline\n> _Revision history._',
    '## External References\n> _External links and papers._'
  ];
  if (snippets && snippets.length) {
    sections.push('---');
    sections.push('## Retrieved Context');
    snippets.forEach((s, idx) => {
      sections.push(`### Snippet ${idx + 1}\n${s.content}`);
    });
  }
  return sections.join('\n\n');
}

module.exports = { getEmbedding, generateTopicMarkdown };
