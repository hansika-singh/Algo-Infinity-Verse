/*
 * modules/aiHints.js
 * Progressive Hint System for DSA Problems  —  Issue #400
 * ------------------------------------------------------------------
 * Curated multi-level hints revealed one at a time (free, offline).
 * When curated hints run out, falls back to POST /api/hint, which calls
 * Gemini server-side using GEMINI_API_KEY (mirrors the existing
 * ai-evaluate-code handler) — the key never reaches the browser.
 *
 * Self-contained ES module: injects its own theme-inheriting styles,
 * persists curated-reveal state in localStorage.
 *
 * USAGE (from wherever a problem is rendered):
 *   import { configureHints, renderHints } from "./modules/aiHints.js";
 *   configureHints({ getCurrentProblem: () => ({ id: p.id, title: p.title, description: p.description }) });
 *   renderHints(document.getElementById("ai-hint-mount"), p);
 *
 * If this repo's modules are GLOBAL scripts (no import/export), delete the
 * `export` lines at the bottom and add instead:
 *   window.AIHints = { configureHints, addHints, renderHints, mountCurrentHints };
 * ------------------------------------------------------------------ */

const STORAGE_PREFIX = "aiv_hints_";
const HINT_API = "/api/hint";

/* One integration hook — set via configureHints(). Returns { id, title, description? }. */
let getCurrentProblem = () => null;

const problemHints = {
  // ── Easy ──────────────────────────────────────────────────────────
  "two-sum": [
    "Single pass is enough — think about what you'd remember about numbers you've already seen.",
    "For each number, the value that completes the pair is (target − current). Can you check for it instantly?",
    "Use a hash map value → index. Look up the complement before inserting the current number.",
    "for i, num in nums: if (target−num) in map → return [map[target−num], i]; else map[num] = i.",
  ],
  "valid-parentheses": [
    "The most recently opened bracket must be closed first — that ordering hints at a data structure.",
    "A stack fits: push opens, and on a close, check the top.",
    "Push '(', '[', '{'. On a close, pop and verify a match; empty stack on close = invalid.",
    "Map close→open. open→push; close→pop and compare. Valid iff stack empty at end.",
  ],
  "binary-search": [
    "The array is sorted — you can discard half the search space each step.",
    "Compare the target to the middle element to choose which half to keep.",
    "Keep lo/hi. mid=(lo+hi)/2; equal→done; smaller→lo=mid+1; else hi=mid−1.",
    "while lo<=hi: mid=lo+(hi−lo)//2; branch on nums[mid] vs target; return −1 if loop ends.",
  ],
  "reverse-linked-list": [
    "You must flip every 'next' pointer. What do you save so you don't lose the rest of the list?",
    "Track three nodes: previous, current, and next (saved before rewiring).",
    "nxt = curr.next; curr.next = prev; prev = curr; curr = nxt.",
    "prev=null, curr=head; while curr: nxt=curr.next; curr.next=prev; prev=curr; curr=nxt; return prev.",
  ],

  // ── Medium ────────────────────────────────────────────────────────
  "longest-substring-without-repeating": [
    "You're looking at a contiguous window — think about a range you can grow and shrink, not fixed slices.",
    "Sliding window: expand the right edge, and when a character repeats, move the left edge past its last occurrence.",
    "Store each character's most recent index. Keep left = max(left, lastSeen[ch] + 1) as you scan.",
    "for r, ch in s: if ch in seen and seen[ch]>=left: left=seen[ch]+1; seen[ch]=r; best=max(best, r−left+1).",
  ],
  "merge-intervals": [
    "Overlaps are much easier to spot once the intervals are in a predictable order.",
    "Sort by start time; then walk through and merge any interval that overlaps the previous one.",
    "Keep a 'current' interval. If next.start ≤ current.end, extend current.end = max(...); else push current and start new.",
    "sort by start; res=[first]; for iv in rest: if iv[0]<=res[-1][1]: res[-1][1]=max(res[-1][1],iv[1]); else res.append(iv).",
  ],
  "3sum": [
    "Brute force is O(n³). Sorting first unlocks a smarter two-pointer scan.",
    "Fix one number, then find pairs summing to its negative using two pointers from both ends.",
    "Sort. For each i, set lo=i+1, hi=end; move pointers based on the sum vs 0. Skip duplicates to avoid repeat triplets.",
    "for i in range(n): lo,hi=i+1,n−1; while lo<hi: s=a[i]+a[lo]+a[hi]; if s==0 record & skip dups; elif s<0 lo++ else hi−−.",
  ],
  "coin-change": [
    "Greedy (largest coin first) fails for sets like [1,5,6,9] — you need to consider all combinations.",
    "This is a DP: the best way to make amount X builds on the best ways to make smaller amounts.",
    "dp[x] = min coins to make x. dp[x] = min(dp[x], dp[x − coin] + 1) over every coin.",
    "dp=[0]+[inf]*amount; for x in 1..amount: for c in coins: if c<=x: dp[x]=min(dp[x],dp[x−c]+1); return dp[amount] or −1.",
  ],

  // ── Hard ──────────────────────────────────────────────────────────
  "median-of-two-sorted-arrays": [
    "Merging is O(m+n); the O(log) requirement means you should binary search, not merge.",
    "Binary search a partition point in the smaller array so left halves of both = right halves in count.",
    "Find i,j splitting both arrays so maxLeft ≤ minRight. Adjust i via binary search on the shorter array.",
    "Binary search i on the shorter array; j = (m+n+1)/2 − i; check L1≤R2 and L2≤R1; median from the boundary elements.",
  ],
  "trapping-rain-water": [
    "Water above a bar depends on the tallest wall to its left AND right — think about those two limits.",
    "Water at index i = min(maxLeftHeight, maxRightHeight) − height[i], summed over all bars.",
    "Two pointers from both ends, moving the smaller side inward while tracking leftMax and rightMax.",
    "l,r=0,n−1; while l<r: if h[l]<h[r]: leftMax=max(...); water+=leftMax−h[l]; l++ else mirror on the right.",
  ],
  "word-ladder": [
    "Each word is a node; two words connect if they differ by one letter — 'shortest sequence' should ring a bell.",
    "This is shortest path on an unweighted graph → breadth-first search from beginWord.",
    "BFS level by level. For each word, try changing every position to a–z; enqueue valid dictionary words, marking visited.",
    "queue=[(begin,1)]; while queue: word,steps=pop; for each position/letter swap in wordSet: if ==end return steps+1; enqueue & remove from set.",
  ],
};

/* ---- state helpers (only curated reveals are persisted) ---- */
function revealed(id) {
  return parseInt(localStorage.getItem(STORAGE_PREFIX + id) || "0", 10);
}
function setRevealed(id, n) {
  localStorage.setItem(STORAGE_PREFIX + id, String(n));
}

/* ---- tiny DOM helper ---- */
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

/* ---- server-side AI fallback (same-origin POST, key stays on the server) ---- */
async function fetchAIHint(problem, previousHints, level) {
  const res = await fetch(HINT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: problem.title,
      description: problem.description || "",
      previousHints,
      level,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.hint) throw new Error(data.error || "Hint request failed");
  return data.hint;
}

/* ---- self-contained styles (injected once) ---- */
function injectStyles() {
  if (document.getElementById("ai-hint-styles")) return;
  const css = `
  .ai-hint-panel{--aih-accent:var(--primary-color,#6c5ce7);--aih-ai:#00b894;--aih-border:var(--border-color,rgba(255,255,255,.12));
    border:1px solid var(--aih-border);border-radius:12px;padding:16px;
    background:var(--card-bg,rgba(255,255,255,.04));color:var(--text-color,inherit);margin:16px 0;font-family:inherit}
  .ai-hint-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
  .ai-hint-title{font-weight:700;font-size:1rem}
  .ai-hint-progress{font-size:.8rem;opacity:.7}
  .ai-hint-list{display:flex;flex-direction:column;gap:8px}
  .ai-hint-item{border-left:3px solid var(--aih-accent);background:rgba(108,92,231,.08);
    border-radius:6px;padding:8px 12px;animation:aih-fade .25s ease}
  .ai-hint-item--ai{border-left-color:var(--aih-ai);background:rgba(0,184,148,.08)}
  .ai-hint-level{font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;opacity:.7;font-weight:700}
  .ai-hint-text{margin:4px 0 0;line-height:1.5;font-size:.92rem}
  .ai-hint-status{font-size:.82rem;opacity:.8;margin:8px 0 0;min-height:1em}
  .ai-hint-btn{margin-top:12px;width:100%;padding:10px 14px;border:none;border-radius:8px;
    background:var(--aih-accent);color:#fff;font-weight:600;cursor:pointer;transition:transform .08s ease,opacity .2s ease}
  .ai-hint-btn:hover:not(:disabled){transform:translateY(-1px)}
  .ai-hint-btn:disabled{opacity:.6;cursor:default}
  @keyframes aih-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`;
  const style = el("style");
  style.id = "ai-hint-styles";
  style.textContent = css;
  document.head.appendChild(style);
}

/* ---- render ---- */
function renderHints(mountEl, problem) {
  if (!mountEl || !problem) return;
  injectStyles();
  mountEl.innerHTML = "";

  const curated = problemHints[problem.id] || [];
  let curatedShown = Math.min(revealed(problem.id), curated.length);
  let aiCount = 0;

  const panel = el("div", "ai-hint-panel");
  const header = el("div", "ai-hint-header");
  header.appendChild(el("span", "ai-hint-title", "\uD83D\uDCA1 Hints"));
  const progress = el("span", "ai-hint-progress");
  header.appendChild(progress);
  panel.appendChild(header);

  const list = el("div", "ai-hint-list");
  panel.appendChild(list);

  const status = el("div", "ai-hint-status");
  panel.appendChild(status);

  const btn = el("button", "ai-hint-btn");
  panel.appendChild(btn);

  function addCard(text, isAI) {
    const card = el("div", "ai-hint-item" + (isAI ? " ai-hint-item--ai" : ""));
    card.appendChild(el("span", "ai-hint-level", "Hint " + (list.children.length + 1) + (isAI ? " \u00B7 AI" : "")));
    card.appendChild(el("p", "ai-hint-text", text));
    list.appendChild(card);
  }

  function refresh() {
    const total = curated.length;
    progress.textContent = total ? curatedShown + " / " + total + (aiCount ? " (+" + aiCount + " AI)" : "") : "AI";
    if (curatedShown < total) {
      btn.disabled = false;
      btn.textContent = curatedShown === 0 && aiCount === 0 ? "Show Hint" : "Next hint (" + (curatedShown + 1) + " of " + total + ")";
    } else {
      btn.disabled = false;
      btn.textContent = "Get AI hint";
    }
  }

  for (let i = 0; i < curatedShown; i++) addCard(curated[i], false);
  refresh();

  btn.addEventListener("click", async () => {
    status.textContent = "";
    // 1) curated hints first (free, offline)
    if (curatedShown < curated.length) {
      addCard(curated[curatedShown], false);
      curatedShown++;
      setRevealed(problem.id, curatedShown);
      refresh();
      return;
    }
    // 2) AI fallback via server
    btn.disabled = true;
    btn.textContent = "Thinking\u2026";
    const prev = Array.prototype.map.call(list.querySelectorAll(".ai-hint-text"), (n) => n.textContent);
    try {
      const hint = await fetchAIHint(problem, prev, curated.length + aiCount + 1);
      addCard(hint, true);
      aiCount++;
    } catch (err) {
      status.textContent = "Couldn\u2019t get an AI hint right now. Tip: re-read the constraints and try a brute force first, then optimize.";
    } finally {
      refresh();
    }
  });

  mountEl.appendChild(panel);
}

/* ---- public API ---- */
function configureHints(opts) {
  if (opts && typeof opts.getCurrentProblem === "function") {
    getCurrentProblem = opts.getCurrentProblem;
  }
}
function addHints(map) {
  Object.assign(problemHints, map || {});
}
function mountCurrentHints() {
  const mount = document.getElementById("ai-hint-mount");
  const problem = getCurrentProblem();
  if (mount && problem) renderHints(mount, problem);
}

export { configureHints, addHints, renderHints, mountCurrentHints };
export default { configureHints, addHints, renderHints, mountCurrentHints };