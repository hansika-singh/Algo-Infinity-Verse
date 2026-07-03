(function () {
  "use strict";

  // Track state
  window.currentFeature = "general";
  window.lastActionTimestamp = Date.now();

  // Update last action timestamp on user activity
  const updateLastAction = () => {
    window.lastActionTimestamp = Date.now();
  };
  window.addEventListener("click", updateLastAction, { capture: true, passive: true });
  window.addEventListener("keydown", updateLastAction, { capture: true, passive: true });
  window.addEventListener("touchstart", updateLastAction, { capture: true, passive: true });

  // Function to report an error payload to the backend
  async function sendErrorToBackend(payload) {
    if (location.protocol === "file:") {
      console.warn("Offline environment; skipping remote error report.", payload);
      return;
    }
    try {
      await fetch("/api/log-error", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Failed to send error log to backend:", err);
    }
  }

  // Create formatted report object
  function createErrorReport(message, source, lineno, colno, error, customFeature) {
    const pageName = document.body && document.body.dataset.page ? document.body.dataset.page : window.location.pathname;
    
    // Attempt to extract stack trace
    let stack = "";
    if (error && error.stack) {
      stack = error.stack;
    } else if (error && error.message) {
      stack = error.message;
    }

    return {
      message: message || (error ? error.message : "Unknown Error"),
      source: source || (error ? error.filename : ""),
      lineno: lineno || (error ? error.lineno : 0),
      colno: colno || (error ? error.colno : 0),
      pageName: pageName,
      feature: customFeature || window.currentFeature || "general",
      lastActionTimestamp: window.lastActionTimestamp,
      timestamp: Date.now(),
      stack: stack,
      userAgent: navigator.userAgent
    };
  }

  // Global window.reportError for manually caught errors
  window.reportError = function (error, feature) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const payload = createErrorReport(errorMsg, null, null, null, error, feature);
    
    console.error("[Global Error Boundary] Caught error:", error);
    sendErrorToBackend(payload);
    showErrorVisualFeedback(errorMsg);
  };

  // 1. window.onerror handler
  window.onerror = function (message, source, lineno, colno, error) {
    const payload = createErrorReport(message, source, lineno, colno, error);
    console.error("[Global Error Boundary] Uncaught Runtime Exception:", message, `at ${source}:${lineno}:${colno}`);
    sendErrorToBackend(payload);
    showErrorVisualFeedback(message);
    return false; // Let browser process the error normally (log to console)
  };

  // 2. window.onunhandledrejection handler
  window.onunhandledrejection = function (event) {
    const reason = event.reason;
    const errorMsg = reason instanceof Error ? reason.message : String(reason);
    const payload = createErrorReport(
      `Unhandled Promise Rejection: ${errorMsg}`,
      null,
      null,
      null,
      reason instanceof Error ? reason : null
    );

    console.error("[Global Error Boundary] Unhandled Promise Rejection:", reason);
    sendErrorToBackend(payload);
    showErrorVisualFeedback(`Promise Rejection: ${errorMsg}`);
  };

  // Premium toast/visual alert for runtime exceptions (avoid breaking UX silently)
  function showErrorVisualFeedback(message) {
    // Avoid spamming multiple error toasts
    if (document.getElementById("error-boundary-toast")) return;

    const toast = document.createElement("div");
    toast.id = "error-boundary-toast";
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(220, 38, 38, 0.95);
      color: #fff;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      z-index: 99999;
      font-family: 'Poppins', sans-serif;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 350px;
      border-left: 4px solid #f87171;
      animation: errorToastIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    // Add keyframes animation if not present
    if (!document.getElementById("error-toast-style")) {
      const style = document.createElement("style");
      style.id = "error-toast-style";
      style.textContent = `
        @keyframes errorToastIn {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    toast.innerHTML = `
      <span style="font-size: 1.25rem;">⚠️</span>
      <div style="flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
        <strong>Application Error</strong><br>
        <span style="opacity: 0.9; font-size: 0.75rem;">${escapeHtml(message)}</span>
      </div>
      <button style="background:none; border:none; color:#fff; font-size:1.2rem; cursor:pointer; font-weight:bold; padding:0 4px;" onclick="this.parentElement.remove()">&times;</button>
    `;

    document.body.appendChild(toast);
    
    // Automatically fade out after 6 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.transition = "opacity 0.5s ease";
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 500);
      }
    }, 6000);
  }

  function escapeHtml(str) {
    if (!str) return "Unknown";
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }
})();
