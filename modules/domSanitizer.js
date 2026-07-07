/**
 * DOM Sanitizer Utility for Algo Infinity Verse
 * Centralized utility to prevent XSS and safely render user-controlled content.
 */

function escapeHtml(unsafe) {
  if (unsafe === null || unsafe === undefined) return '';
  const stringified = String(unsafe);
  return stringified
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeRender(element, content, asHTML = false) {
  if (!element) return;
  if (!asHTML) {
    element.textContent = content;
  } else {
    element.innerHTML = sanitizeHTML(content);
  }
}

function sanitizeHTML(htmlStr) {
  if (htmlStr === null || htmlStr === undefined) return '';
  const stringified = String(htmlStr);
  
  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(stringified, 'text/html');
      
      const cleanNode = (node) => {
        if (node.nodeType === 3) { // Text node
          return;
        }
        
        if (node.nodeType !== 1) { // Not an element node
          node.remove();
          return;
        }
        
        const tag = node.tagName.toLowerCase();
        const blacklist = ['script', 'iframe', 'object', 'embed', 'style', 'link', 'meta', 'svg', 'math'];
        if (blacklist.includes(tag)) {
          node.remove();
          return;
        }
        
        const attrs = Array.from(node.attributes);
        attrs.forEach(attr => {
          const name = attr.name.toLowerCase();
          const value = attr.value.toLowerCase();
          
          if (name.startsWith('on') || value.startsWith('javascript:')) {
            node.removeAttribute(attr.name);
          }
        });
        
        Array.from(node.childNodes).forEach(cleanNode);
      };
      
      Array.from(doc.body.childNodes).forEach(cleanNode);
      return doc.body.innerHTML;
    } catch (e) {
      console.error('DOMParser sanitization failed, falling back to escapeHtml:', e);
      return escapeHtml(stringified);
    }
  }
  
  // Fallback for environments without DOMParser (e.g. server-side/test environments)
  return stringified
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*')/gi, '')
    .replace(/\s*href\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, '');
}

// Expose to window for classic scripts
if (typeof window !== 'undefined') {
  window.DOMSanitizer = {
    escapeHtml,
    safeRender,
    sanitizeHTML
  };
}

// Support ES module exports
export { escapeHtml, safeRender, sanitizeHTML };
