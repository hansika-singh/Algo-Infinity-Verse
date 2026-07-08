// backend/knowledge-base/vectorStore.js
// Simple in‑memory vector store with persistence to JSON file.
// Uses cosine similarity on embedding vectors.
// Lightweight substitute for FAISS for prototype.

const fs = require('fs');
const path = require('path');

const STORE_PATH = path.resolve(__dirname, 'vectorStore.json');

let store = { documents: [] };
if (fs.existsSync(STORE_PATH)) {
  try { store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8')); } catch (_) { store = { documents: [] }; }
}

async function saveStore() {
  await fs.promises.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

async function addDocument(topic, content, embedding) {
  const doc = { topic, content, embedding };
  // Replace existing topic
  store.documents = store.documents.filter(d => d.topic !== topic);
  store.documents.push(doc);
  await saveStore();
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function search(queryEmbedding, topK = 5) {
  const scores = store.documents.map(doc => ({
    topic: doc.topic,
    content: doc.content,
    score: cosineSimilarity(queryEmbedding, doc.embedding)
  }));
  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, topK);
}

module.exports = { addDocument, search };
