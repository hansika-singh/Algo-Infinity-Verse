/**
 * Custom Markdown Parser for Algo Infinity Verse
 * Supports common markdown features and handles nested formatting.
 * Designed to be used in conjunction with DOMSanitizer for XSS prevention.
 */

class MarkdownParser {
  /**
   * Main entry point to parse markdown text to HTML.
   * @param {string} text - The markdown text.
   * @returns {string} - The raw HTML string (Needs sanitization before rendering).
   */
  static parse(text) {
    if (!text) return '';
    
    // Normalize line endings
    text = text.replace(/\r\n/g, '\n');

    return this.parseBlocks(text);
  }

  /**
   * Internal function to escape HTML characters.
   * Used specifically for code blocks so that DOMSanitizer doesn't strip literal tags.
   */
  static escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  static parseBlocks(text) {
    const lines = text.split('\n');
    let html = '';
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Empty line
      if (line.trim() === '') {
        continue;
      }

      // Multi-line Code blocks
      if (line.trim().startsWith('```')) {
        let codeContent = '';
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeContent += this.escapeHtml(lines[i]) + '\n';
          i++;
        }
        html += `<pre><code>${codeContent.trimEnd()}</code></pre>`;
        continue;
      }

      // Blockquotes
      if (line.trim().startsWith('>')) {
        let quoteContent = '';
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quoteContent += lines[i].replace(/^\s*>\s?/, '') + '\n';
          i++;
        }
        i--; // backtrack one
        html += `<blockquote>${this.parseBlocks(quoteContent)}</blockquote>`;
        continue;
      }

      // Headings
      const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const content = this.parseInline(headingMatch[2]);
        html += `<h${level}>${content}</h${level}>`;
        continue;
      }

      // Lists (Unordered and Ordered with nesting)
      if (line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)/)) {
        let listHtml = '';
        let stack = []; // To keep track of indentation levels and list types
        
        while (i < lines.length && lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)/)) {
            const match = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)/);
            const indent = match[1].length;
            const bullet = match[2];
            const isOrdered = /\d+\./.test(bullet);
            const tag = isOrdered ? 'ol' : 'ul';
            const content = this.parseInline(match[3]);

            if (stack.length === 0) {
                stack.push({ indent, tag });
                listHtml += `<${tag}>\n`;
            } else {
                let current = stack[stack.length - 1];
                if (indent > current.indent) {
                    stack.push({ indent, tag });
                    listHtml += `<${tag}>\n`;
                } else if (indent < current.indent) {
                    while (stack.length > 0 && indent < stack[stack.length - 1].indent) {
                        const popped = stack.pop();
                        listHtml += `</${popped.tag}>\n`;
                    }
                    // Handle case where it switches from ul to ol or vice versa at the same level
                    if (stack.length > 0 && stack[stack.length - 1].tag !== tag) {
                        listHtml += `</${stack[stack.length - 1].tag}>\n<${tag}>\n`;
                        stack[stack.length - 1].tag = tag;
                    }
                } else {
                    if (current.tag !== tag) {
                        listHtml += `</${current.tag}>\n<${tag}>\n`;
                        stack[stack.length - 1].tag = tag;
                    }
                }
            }
            listHtml += `<li>${content}</li>\n`;
            i++;
        }
        i--;
        
        while (stack.length > 0) {
            const popped = stack.pop();
            listHtml += `</${popped.tag}>\n`;
        }
        
        html += listHtml;
        continue;
      }

      // Paragraph (handle multi-line paragraphs until an empty line or block element)
      let pContent = '';
      while (
        i < lines.length && 
        lines[i].trim() !== '' && 
        !lines[i].trim().startsWith('```') &&
        !lines[i].trim().startsWith('>') &&
        !lines[i].match(/^(#{1,6})\s+(.*)/) &&
        !lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)/)
      ) {
        pContent += lines[i] + '\n';
        i++;
      }
      i--;
      
      // Trim trailing newline and parse inline formatting
      html += `<p>${this.parseInline(pContent.trimEnd())}</p>`;
    }

    return html;
  }

  static parseInline(text) {
    let html = text;

    // Inline Code: MUST be processed first to prevent formatting inside code blocks
    // Replace with a placeholder to prevent further processing, then restore later.
    const codePlaceholders = [];
    html = html.replace(/`([^`]+)`/g, (match, p1) => {
      const placeholder = `CODEBLOCKPLACEHOLDER${codePlaceholders.length}END`;
      codePlaceholders.push(`<code>${this.escapeHtml(p1)}</code>`);
      return placeholder;
    });

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Bold (**text** or __text__)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italics (*text* or _text_)
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Restore inline code placeholders
    codePlaceholders.forEach((codeHtml, index) => {
      html = html.replace(`CODEBLOCKPLACEHOLDER${index}END`, codeHtml);
    });

    // Convert newlines to <br> for multi-line paragraphs
    html = html.replace(/\n/g, '<br>');

    return html;
  }
}

// Expose to window for classic scripts
if (typeof window !== 'undefined') {
  window.MarkdownParser = MarkdownParser;
}

// Support ES module exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MarkdownParser };
} else if (typeof exports !== 'undefined') {
  exports.MarkdownParser = MarkdownParser;
}
