/*
 * modules/aiHintsBootstrap.js
 * ------------------------------------------------------------------
 * Zero-wiring loader for the hint system. It watches the page, and when a
 * problem is open it reads the problem's TITLE from the DOM, derives the id
 * (same slug rule aiHints.js's curated hint keys use), and injects the hint
 * panel — so you do NOT have to edit the problem-render function or know
 * its variables.
 *
 * SETUP (2 things):
 *   1. Set TITLE_SELECTOR below to the element that shows the problem title
 *      (e.g. "Maximum Depth"). Get it in 10s: in the browser, right-click the
 *      title -> Inspect -> in DevTools right-click the highlighted element ->
 *      Copy -> "Copy selector", and paste it between the quotes.
 *   2. Load this file once from index.html (see the <script> line in chat).
 *
 * If the panel appears in the wrong spot, change ANCHOR_TEXT (it inserts the
 * panel just before the element whose text equals ANCHOR_TEXT).
 * ------------------------------------------------------------------ */

import { renderHints } from "./aiHints.js";

// ===== Pre-configured for Algo-Infinity-Verse =====
// The problem-solving modal is #quizEditorModal (opened via openQuizEditor()
// in script.js, toggled with the "active" class). Its title element is
// #quizTitle (script.js sets quizTitle.textContent = problem.title before
// adding "active"). Change only if your markup differs.
const MODAL_SELECTOR = "#quizEditorModal";
const TITLE_SELECTOR = "#quizTitle";       // the problem-title element in the coding modal
const DESCRIPTION_SELECTOR = "#quizDescription";
const ANCHOR_TEXT = "Test Cases";          // panel is inserted just before this heading
// ==================================================

// Same slugify rule aiHints.js's curated hint keys use: lowercase, non-alphanumerics -> hyphens.
function slugify(t) {

    return t.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

}

// Find a leaf element whose exact text equals `text` (for the insert anchor).
function findByText(text) {
  const nodes = document.querySelectorAll("h1,h2,h3,h4,h5,div,span,p,strong,b");
  for (const n of nodes) {
    if (n.children.length === 0 && n.textContent.trim() === text) return n;
  }
  return null;
}

let lastTitle = null;

function mount() {
  const modalEl = document.querySelector(MODAL_SELECTOR);
  // Only mount while the problem modal is actually open — the title element
  // keeps stale/placeholder text in the DOM when the modal is closed, which
  // would otherwise mount a bogus hint panel for a problem that isn't open.
  if (!modalEl || !modalEl.classList.contains("active")) {
    lastTitle = null;
    return;
  }

  const titleEl = document.querySelector(TITLE_SELECTOR);
  if (!titleEl) return;                       // no problem open
  const title = titleEl.textContent.trim();
  if (!title) return;

  const existing = document.getElementById("ai-hint-mount");
  // Already mounted for this same problem -> do nothing (prevents re-render
  // wiping revealed hints when the DOM changes as you click).
  if (existing && lastTitle === title) return;
  lastTitle = title;

  let mountEl = existing;
  if (!mountEl) {
    mountEl = document.createElement("div");
    mountEl.id = "ai-hint-mount";
    const anchor = findByText(ANCHOR_TEXT);
    if (anchor && anchor.parentElement) {
      anchor.parentElement.insertBefore(mountEl, anchor);
    } else {
      // fallback: drop it right under the title
      (titleEl.parentElement || document.body).appendChild(mountEl);
    }
  }

  const descEl = document.querySelector(DESCRIPTION_SELECTOR);
  const description = descEl ? descEl.textContent.trim() : "";
  renderHints(mountEl, { id: slugify(title), title, description });
}

// Run now, on load, and whenever the page changes (problem opens/switches).
const observer = new MutationObserver(() => mount());
observer.observe(document.body, { childList: true, subtree: true });
document.addEventListener("DOMContentLoaded", mount);
mount();