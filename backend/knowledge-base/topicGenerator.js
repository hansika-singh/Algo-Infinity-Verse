// backend/knowledge-base/topicGenerator.js
// Orchestrates RAG workflow: retrieve user data (stub), generate markdown, store vector and file.

const path = require('path');
const fs = require('fs');
const { getEmbedding, generateTopicMarkdown } = require('./llmClient');
const { addDocument, search } = require('./vectorStore');
const { generateStatsSection } = require('./compressionEngine/summaryGenerator');

function slugify(str) {
  return str.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '').replace(/\-\-+/g, '-').replace(/^\-+/, '').replace(/\-+$/, '');
}

async function fetchUserSnippets(topic) {
  // TODO: integrate with user's notes, submissions, flashcards, etc.
  return [];
}

async function generateAndStoreTopic(topic) {
  const snippets = await fetchUserSnippets(topic);
  // Generate main markdown content.
  const baseMarkdown = generateTopicMarkdown(topic, snippets);
  // Generate personal stats section.
  const statsMarkdown = generateStatsSection(topic, 'anonymous');
  // Combine sections.
  const markdown = `${baseMarkdown}\n\n${statsMarkdown}`;
  const embedding = getEmbedding(markdown);
  addDocument(topic, markdown, embedding);
  const slug = slugify(topic);
  const targetPath = path.resolve(__dirname, '../../pages/knowledge-base', `${slug}.md`);
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(targetPath, markdown, 'utf-8');
  return { slug, path: targetPath };
}

module.exports = { generateAndStoreTopic, search };
