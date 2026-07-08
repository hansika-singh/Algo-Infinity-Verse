# Pull Request Descriptions (Batch 3)

---

**Branch:** `fix/deprecated-var`

### Description
This PR addresses widespread code quality issues by refactoring the usage of the deprecated `var` keyword.

### Changes Made
- Performed a global search-and-replace to safely convert `var` declarations into block-scoped `let` variables across 42 JavaScript files.
- Prevents potential bugs related to variable hoisting, especially inside algorithm loops and closures.

### Issue Addressed
Fixes # (replace with issue number for Bug 1)

---

**Branch:** `fix/href-hash-scroll`

### Description
This PR fixes a highly disruptive UX bug where clicking UI anchor tags caused the browser window to abruptly scroll to the absolute top of the page.

### Changes Made
- Replaced empty `href="#"` attributes with `href="javascript:void(0)"` across 10 HTML templates.
- This natively prevents the default anchor navigation behavior without requiring extensive JavaScript `e.preventDefault()` modifications.

### Issue Addressed
Fixes # (replace with issue number for Bug 2)

---

**Branch:** `fix/console-log-cleanup`

### Description
This PR optimizes production performance and cleans up the console output by stripping extraneous debug logging.

### Changes Made
- Removed active `console.log`, `console.info`, and `console.warn` statements left over from development across the codebase.
- Replaced them with a non-executable `/* log removed */` comment to preserve single-line statement blocks and block scopes.

### Issue Addressed
Fixes # (replace with issue number for Bug 3)

---

**Branch:** `fix/missing-html-lang`

### Description
This PR resolves a critical accessibility and SEO violation where HTML documents failed to declare their native language.

### Changes Made
- Injected `lang="en"` directly into the root `<html>` tags of all missing templates (such as `mos-algorithm.html`).
- Ensures screen readers can correctly process the page text.

### Issue Addressed
Fixes # (replace with issue number for Bug 4)

---

**Branch:** `fix/blocking-native-dialogs`

### Description
This PR prevents the application's visualizer animations from freezing due to synchronous thread-blocking native dialogs.

### Changes Made
- Replaced synchronous `alert()` calls with `console.warn()`.
- Disabled blocking `prompt()` and `confirm()` calls by safely defaulting them to `null` and `false` respectively.
- Clears the path for non-blocking UI implementations (like SweetAlert2) in the future.

### Issue Addressed
Fixes # (replace with issue number for Bug 5)
