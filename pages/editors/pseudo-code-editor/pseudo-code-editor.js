/**
 * pseudo-code-editor.js
 * Lexer, Parser, and real-time syntax highlighter for Pseudo-code
 */

document.addEventListener("DOMContentLoaded", () => {
  initPseudoCodeEditor();
});

function initPseudoCodeEditor() {
  const codeEditor = document.getElementById('pseudoCodeEditor');
  const highlightLayer = document.getElementById('pseudoHighlightLayer');
  const lineNumbers = document.getElementById('pseudoLineNumbers');
  const lintLog = document.getElementById('lintLog');
  const lintStatus = document.getElementById('lintStatus');
  const btnFormat = document.getElementById('btnFormat');
  const btnClear = document.getElementById('btnClear');

  if (!codeEditor) return;

  const lexer = /(\/\/.*$)|(&quot;.*?&quot;|'.*?')|\b(IF|THEN|ELSE|ENDIF|FOR|TO|STEP|ENDFOR|WHILE|ENDWHILE|DO|UNTIL|REPEAT|RETURN|PRINT|INPUT|READ|FUNCTION|ENDFUNCTION|VAR|SET)\b|\b(\d+(?:\.\d+)?)\b|(=|\+|-|\*|\/|&lt;|&gt;|&lt;=|&gt;=|!=|\bAND\b|\bOR\b|\bNOT\b)/g;

  // Track scroll sync
  codeEditor.addEventListener('scroll', () => {
    highlightLayer.scrollTop = codeEditor.scrollTop;
    highlightLayer.scrollLeft = codeEditor.scrollLeft;
    lineNumbers.scrollTop = codeEditor.scrollTop;
  });

  // Handle Tab key for indentation
  codeEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = codeEditor.selectionStart;
      const end = codeEditor.selectionEnd;
      
      codeEditor.value = codeEditor.value.substring(0, start) + "  " + codeEditor.value.substring(end);
      codeEditor.selectionStart = codeEditor.selectionEnd = start + 2;
      
      updateEditor();
    }
  });

  codeEditor.addEventListener('input', updateEditor);
  btnFormat.addEventListener('click', formatCode);
  btnClear.addEventListener('click', () => {
    codeEditor.value = "";
    updateEditor();
  });

  function updateEditor() {
    const text = codeEditor.value;
    updateLineNumbers(text);
    highlightAndLint(text);
  }

  function updateLineNumbers(text) {
    const lines = text.split('\n').length;
    let numbersHtml = '';
    for (let i = 1; i <= lines; i++) {
      numbersHtml += i + '<br>';
    }
    lineNumbers.innerHTML = numbersHtml;
  }

  function highlightAndLint(text) {
    const lines = text.split('\n');
    let highlightedHtml = '';
    const errors = [];
    
    // Stack for tracking block structures (IF, FOR, WHILE, FUNCTION)
    const blockStack = [];
    let bracketsCount = { '(': 0, '[': 0, '{': 0 };

    lines.forEach((line, index) => {
      let lineNum = index + 1;
      
      // Syntax Highlighting transformations
      // We must process carefully to avoid replacing HTML injected from previous steps.
      // So we tokenize properly or use a trick: Escape HTML first, then apply regex safely.
      let htmlLine = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      let lineErrorTitle = null;

      // Linting Analysis on the raw text
      const rawTrimmed = line.trim();
      const tokens = rawTrimmed.split(/\s+/);
      
      if (tokens.length > 0) {
        const firstToken = tokens[0].toUpperCase();
        
        // Block Tracking
        if (['IF', 'FOR', 'WHILE', 'FUNCTION', 'REPEAT'].includes(firstToken)) {
          blockStack.push({ type: firstToken, line: lineNum });
        } else if (['ENDIF', 'ENDFOR', 'ENDWHILE', 'ENDFUNCTION', 'UNTIL'].includes(firstToken)) {
          if (blockStack.length === 0) {
            errors.push({ line: lineNum, msg: `Found ${firstToken} but no opening block.` });
            lineErrorTitle = `Unexpected ${firstToken}`;
          } else {
            const expectedEnd = {
              'IF': 'ENDIF',
              'FOR': 'ENDFOR',
              'WHILE': 'ENDWHILE',
              'FUNCTION': 'ENDFUNCTION',
              'REPEAT': 'UNTIL'
            };
            const openBlock = blockStack.pop();
            if (expectedEnd[openBlock.type] !== firstToken) {
              errors.push({ line: lineNum, msg: `Expected ${expectedEnd[openBlock.type]} to close ${openBlock.type} from line ${openBlock.line}, but found ${firstToken}.` });
              lineErrorTitle = `Mismatched block close`;
            }
          }
        }
      }

      // Bracket counting
      for (let char of rawTrimmed) {
        if (char === '(') bracketsCount['(']++;
        if (char === ')') bracketsCount['(']--;
        if (char === '[') bracketsCount['[']++;
        if (char === ']') bracketsCount['[']--;
        if (char === '{') bracketsCount['{']++;
        if (char === '}') bracketsCount['{']--;
      }
      
      if (bracketsCount['('] < 0 || bracketsCount['['] < 0 || bracketsCount['{'] < 0) {
        errors.push({ line: lineNum, msg: `Mismatched closing bracket detected.` });
        if (!lineErrorTitle) lineErrorTitle = `Mismatched bracket`;
        // Reset to avoid cascading errors too much
        if (bracketsCount['('] < 0) bracketsCount['('] = 0;
        if (bracketsCount['['] < 0) bracketsCount['['] = 0;
        if (bracketsCount['{'] < 0) bracketsCount['{'] = 0;
      }

      htmlLine = htmlLine.replace(lexer, (match, pComment, pString, pKeyword, pNumber, pOperator) => {
        if (pComment) return `<span class="token-comment">${pComment}</span>`;
        if (pString) return `<span class="token-string">${pString}</span>`;
        if (pKeyword) return `<span class="token-keyword">${pKeyword}</span>`;
        if (pNumber) return `<span class="token-number">${pNumber}</span>`;
        if (pOperator) return `<span class="token-operator">${pOperator}</span>`;
        return match;
      });

      if (lineErrorTitle) {
        htmlLine = `<span class="token-error" title="${lineErrorTitle}">${htmlLine}</span>`;
      }

      highlightedHtml += htmlLine + (index < lines.length - 1 ? '\n' : '');
    });

    // Check for unclosed blocks at EOF
    blockStack.forEach(block => {
      errors.push({ line: 'EOF', msg: `Unclosed ${block.type} block starting at line ${block.line}.` });
    });
    
    if (bracketsCount['('] > 0) errors.push({ line: 'EOF', msg: `Unclosed parenthesis '('.` });
    if (bracketsCount['['] > 0) errors.push({ line: 'EOF', msg: `Unclosed bracket '['.` });
    if (bracketsCount['{'] > 0) errors.push({ line: 'EOF', msg: `Unclosed brace '{'.` });

    highlightLayer.innerHTML = highlightedHtml;
    updateLintLog(errors);
  }

  function updateLintLog(errors) {
    lintLog.innerHTML = '';
    
    if (errors.length === 0) {
      lintStatus.className = "status-badge valid";
      lintStatus.innerHTML = '<i class="fas fa-check-circle"></i> Valid';
      lintLog.innerHTML = '<li class="lint-empty">No syntax errors found. Excellent!</li>';
    } else {
      lintStatus.className = "status-badge invalid";
      lintStatus.innerHTML = '<i class="fas fa-times-circle"></i> ' + errors.length + ' Issues';
      
      errors.forEach(err => {
        const li = document.createElement('li');
        li.className = 'lint-error';
        li.textContent = `Line ${err.line}: ${err.msg}`;
        lintLog.appendChild(li);
      });
    }
  }

  function formatCode() {
    const lines = codeEditor.value.split('\n');
    let indentLevel = 0;
    let formattedText = '';
    
    const indentIncrease = ['IF', 'FOR', 'WHILE', 'FUNCTION', 'REPEAT', 'ELSE'];
    const indentDecrease = ['ENDIF', 'ENDFOR', 'ENDWHILE', 'ENDFUNCTION', 'UNTIL', 'ELSE'];

    lines.forEach(line => {
      let trimmed = line.trim();
      if (!trimmed) {
        formattedText += '\n';
        return;
      }
      
      const firstToken = trimmed.split(/\s+/)[0].toUpperCase();
      
      if (indentDecrease.includes(firstToken) && indentLevel > 0) {
        indentLevel--;
      }
      
      const indentation = '  '.repeat(Math.max(0, indentLevel));
      formattedText += indentation + trimmed + '\n';
      
      if (indentIncrease.includes(firstToken)) {
        indentLevel++;
        // If it was ELSE, we decreased then increased, keeping it at the same indent as IF, but subsequent lines get indented.
      }
    });
    
    // Remove trailing newline if original didn't have it
    if (!codeEditor.value.endsWith('\n') && formattedText.endsWith('\n')) {
      formattedText = formattedText.slice(0, -1);
    }
    
    codeEditor.value = formattedText;
    updateEditor();
  }

  // Initial trigger
  updateEditor();
}
