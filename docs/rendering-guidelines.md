# Repository Rendering & Sanitization Guidelines

This document outlines the standard security guidelines for dynamically rendering content in the **Algo Infinity Verse** platform. Adhering to these patterns is crucial to prevent Cross-Site Scripting (XSS) and other client-side injection vulnerabilities.

---

## 🚫 The Problem: Unsafe innerHTML Injection

Directly injecting user-controlled metadata or inputs into the DOM using properties like `innerHTML` or `insertAdjacentHTML` creates security risks:

```javascript
// ❌ UNSAFE: A user-controlled value is rendered directly
container.innerHTML = `<span class="tag">#${userTag}</span>`;
```

If `userTag` contains malicious content (e.g., `onload="alert(1)"` or a `<script>` tag), it can execute arbitrary JavaScript in the context of the user's browser session.

---

## ✅ Best Practices & Guidelines

### 1. Prefer Safer DOM APIs (First Choice)

Wherever possible, construct DOM elements programmatically. Properties like `textContent` and `innerText` automatically escape all special characters, rendering them safely as text.

```javascript
//  SAFE: Using DOM APIs
const span = document.createElement('span');
span.className = 'tag';
span.textContent = `#${userTag}`; // Automatically escaped
container.appendChild(span);
```

### 2. Centralized Sanitization Layer

When you must interpolate string HTML templates (e.g. for rich text rendering), always run the user-controlled fields through the centralized sanitization utility.

The sanitization module is available at: [domSanitizer.js](../modules/domSanitizer.js).

#### Under ES Modules (ESM)

```javascript
import { escapeHtml, sanitizeHTML } from '/modules/domSanitizer.js';

// For plain text:
const safeName = escapeHtml(userProgress.name);
element.innerHTML = `<span>User: ${safeName}</span>`;

// For rich text HTML content:
const safeBody = sanitizeHTML(userContent.body);
element.innerHTML = `<div class="rich-text">${safeBody}</div>`;
```

#### Under Classic Scripts

Ensure `/modules/domSanitizer.js` is loaded prior to your script in the HTML file. It will be available globally via the `window.DOMSanitizer` namespace:

```javascript
const safeTitle = DOMSanitizer.escapeHtml(post.title);
titleEl.innerHTML = `<h4 class="post-title">${safeTitle}</h4>`;
```

---

## 🛡️ Guidelines Checklist for PR Reviews

When reviewing code, look for:

- [ ] Any use of `innerHTML` or `insertAdjacentHTML` incorporating dynamic/user variables.
- [ ] Event handler attributes (like `onclick="..."`) defined inline in template strings. Prefer `.addEventListener(...)` on elements.
- [ ] Verification that `DOMSanitizer.escapeHtml` or DOM node creation is applied to any imported JSON or network responses before rendering.
