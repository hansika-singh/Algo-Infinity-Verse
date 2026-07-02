/* ─── AI Intent Detection Assistant ───
 * Tracks coding behavior signals (edits, run attempts, errors, pauses)
 * and classifies the user's current intent state:
 *   - "stuck"       : repeated errors with no meaningful edits
 *   - "guessing"     : rapid runs with minimal code changes
 *   - "confident"    : steady edits, successful runs
 *   - "overthinking" : long pauses with frequent small edits, no runs
 *
 * Usage:
 *   const detector = createIntentDetector({
 *     onStateChange: (state, details) => { ... }
 *   });
 *   detector.recordEdit(currentCode);
 *   detector.recordRun({ hasError: true });
 */

function createIntentDetector(options = {}) {
  const onStateChange = options.onStateChange || (() => {});

  const STUCK_ERROR_THRESHOLD = 3;       // consecutive errored runs
  const GUESS_RUN_WINDOW_MS = 30000;     // window for rapid-run detection
  const GUESS_RUN_COUNT = 3;             // runs within window to flag guessing
  const GUESS_DIFF_THRESHOLD = 10;       // max chars changed between guesses
  const OVERTHINK_PAUSE_MS = 45000;      // pause before flagging overthinking
  const OVERTHINK_MIN_EDITS = 5;         // edits with no run before overthinking
  const STUCK_NO_EDIT_MS = 20000;        // no edits between errored runs

  let lastCode = "";
  let lastEditAt = Date.now();
  let lastRunAt = 0;
  let consecutiveErrorRuns = 0;
  let editsSinceLastRun = 0;
  const recentRuns = []; // { at, codeSnapshot, hasError }

  let currentState = "neutral";

  function diffSize(a, b) {
    const maxLen = Math.max(a.length, b.length);
    let diff = 0;
    for (let i = 0; i < maxLen; i++) {
      if (a[i] !== b[i]) diff++;
    }
    return diff;
  }

  function setState(newState, details = {}) {
    if (newState === currentState) return;
    currentState = newState;
    onStateChange(newState, details);
  }

  function recordEdit(code) {
    const now = Date.now();
    lastEditAt = now;
    editsSinceLastRun++;
    lastCode = code;

    // If user made a meaningful edit after errors, consider clearing stuck state
    // (Currently, stuck state is only cleared by a successful run in recordRun)

    evaluate();
  }

  function recordRun({ hasError, code } = {}) {
    const now = Date.now();
    const codeSnapshot = code !== undefined ? code : lastCode;

    if (hasError) {
      consecutiveErrorRuns++;
    } else {
      consecutiveErrorRuns = 0;
    }

    recentRuns.push({ at: now, codeSnapshot, hasError });
    while (recentRuns.length > 0 && now - recentRuns[0].at > GUESS_RUN_WINDOW_MS) {
      recentRuns.shift();
    }

    lastRunAt = now;
    editsSinceLastRun = 0;

    evaluate();
  }

  function evaluate() {
    const now = Date.now();

    // Stuck: repeated error runs with little/no editing between them
    if (
      consecutiveErrorRuns >= STUCK_ERROR_THRESHOLD &&
      now - lastEditAt > STUCK_NO_EDIT_MS
    ) {
      setState("stuck", { consecutiveErrorRuns });
      return;
    }

    // Guessing: many runs in a short window with minimal code changes
    if (recentRuns.length >= GUESS_RUN_COUNT) {
      const recent = recentRuns.slice(-GUESS_RUN_COUNT);
      let smallDiffs = 0;
      for (let i = 1; i < recent.length; i++) {
        if (diffSize(recent[i - 1].codeSnapshot, recent[i].codeSnapshot) <= GUESS_DIFF_THRESHOLD) {
          smallDiffs++;
        }
      }
      if (smallDiffs >= GUESS_RUN_COUNT - 1) {
        setState("guessing", { recentRunCount: recentRuns.length });
        return;
      }
    }

    // Overthinking: long pause + many edits without running
    if (
      editsSinceLastRun >= OVERTHINK_MIN_EDITS &&
      now - lastEditAt > OVERTHINK_PAUSE_MS
    ) {
      setState("overthinking", { editsSinceLastRun });
      return;
    }

    // Confident: most recent run succeeded
    if (recentRuns.length > 0 && !recentRuns[recentRuns.length - 1].hasError) {
      setState("confident", {});
      return;
    }

    setState("neutral", {});
  }

  // Periodic check for time-based states (overthinking, stuck-without-edit)
  const intervalId = setInterval(evaluate, 5000);
  if (intervalId.unref) intervalId.unref();

  return {
    recordEdit,
    recordRun,
    getState: () => currentState,
    destroy: () => clearInterval(intervalId),
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { createIntentDetector };
}