import * as acorn from 'acorn';
import { getDb, COLLECTIONS } from '../../firebase.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Automatically detects the language of a given code snippet.
 * @param {string} code
 * @returns {'javascript'|'python'|'cpp'}
 */
export function detectLanguage(code) {
  if (
    /#include\b|std::|\b(cout|cin)\b|\bvector\s*<|\b(int|float|double|char)\s+[a-zA-Z_]\w*\s*[(;=]/.test(
      code
    )
  ) {
    return 'cpp';
  }
  if (/\bdef\s+[a-zA-Z_]\w*\s*\(|import\s+[a-zA-Z_]\w*\b|^\s*#|print\s*\(/.test(code)) {
    return 'python';
  }
  return 'javascript';
}

/**
 * Generates structural sequence of AST node types for JavaScript code.
 * @param {string} code
 * @returns {string[]}
 */
export function getJsStructuralSequence(code) {
  try {
    const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
    const sequence = [];

    const traverse = (node) => {
      if (!node || typeof node !== 'object') return;

      if (node.type) {
        const structuralTypes = new Set([
          'ForStatement',
          'WhileStatement',
          'DoWhileStatement',
          'ForInStatement',
          'ForOfStatement',
          'IfStatement',
          'SwitchStatement',
          'SwitchCase',
          'BinaryExpression',
          'LogicalExpression',
          'AssignmentExpression',
          'UpdateExpression',
          'CallExpression',
          'FunctionDeclaration',
          'FunctionExpression',
          'ArrowFunctionExpression',
          'ReturnStatement',
          'ThrowStatement',
          'TryStatement',
          'CatchClause',
          'ConditionalExpression',
          'MemberExpression',
          'NewExpression',
        ]);

        if (structuralTypes.has(node.type)) {
          if (
            node.type === 'BinaryExpression' ||
            node.type === 'LogicalExpression' ||
            node.type === 'AssignmentExpression'
          ) {
            sequence.push(`${node.type}:${node.operator}`);
          } else {
            sequence.push(node.type);
          }
        }
      }

      for (const key in node) {
        if (key === 'loc' || key === 'start' || key === 'end' || key === 'raw') continue;
        const val = node[key];
        if (Array.isArray(val)) {
          for (const subNode of val) {
            traverse(subNode);
          }
        } else if (val && typeof val === 'object') {
          traverse(val);
        }
      }
    };

    traverse(ast);
    return sequence;
  } catch (err) {
    return getFallbackStructuralSequence(code);
  }
}

/**
 * Tokenizer-based structural fallback for JS, Python, and C++.
 * @param {string} code
 * @param {string} lang
 * @returns {string[]}
 */
export function getStructuralSequence(code, lang) {
  const language = (lang || '').toLowerCase();

  if (language === 'js' || language === 'javascript') {
    return getJsStructuralSequence(code);
  }

  let cleanCode = code;
  if (language === 'python' || language === 'py') {
    cleanCode = cleanCode.replace(/"""[\s\S]*?"""/g, '');
    cleanCode = cleanCode.replace(/'''[\s\S]*?'''/g, '');
    cleanCode = cleanCode.replace(/#.*$/gm, '');
    cleanCode = cleanCode.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '');
    cleanCode = cleanCode.replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, '');
  } else {
    // C++ or Fallback
    cleanCode = cleanCode.replace(/\/\*[\s\S]*?\*\//g, '');
    cleanCode = cleanCode.replace(/\/\/.*$/gm, '');
    cleanCode = cleanCode.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '');
    cleanCode = cleanCode.replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, '');
  }

  const sequence = [];
  const tokenRegex =
    /\b(def|function|for|while|do|if|elif|else|switch|case|return|try|catch|except)\b|(\+\+|--|==|!=|<=|>=|&&|\|\||\+=|-=|\*=|\/=|%=|\+|-|\*|\/|%|=|<|>|!|\?|:)|([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/g;

  let match;
  while ((match = tokenRegex.exec(cleanCode)) !== null) {
    const [_, keyword, operator, call] = match;

    if (keyword) {
      switch (keyword) {
        case 'def':
        case 'function':
          sequence.push('FunctionDeclaration');
          break;
        case 'for':
          sequence.push('ForStatement');
          break;
        case 'while':
          sequence.push('WhileStatement');
          break;
        case 'do':
          sequence.push('DoWhileStatement');
          break;
        case 'if':
        case 'elif':
          sequence.push('IfStatement');
          break;
        case 'else':
          sequence.push('ElseStatement');
          break;
        case 'switch':
          sequence.push('SwitchStatement');
          break;
        case 'case':
          sequence.push('SwitchCase');
          break;
        case 'return':
          sequence.push('ReturnStatement');
          break;
        case 'try':
          sequence.push('TryStatement');
          break;
        case 'catch':
        case 'except':
          sequence.push('CatchClause');
          break;
      }
    } else if (operator) {
      if (['=', '+=', '-=', '*=', '/=', '%='].includes(operator)) {
        sequence.push('AssignmentExpression');
      } else {
        sequence.push(`Operator:${operator}`);
      }
    } else if (call) {
      const keywords = new Set(['if', 'for', 'while', 'switch', 'catch', 'elif']);
      if (!keywords.has(call)) {
        sequence.push('CallExpression');
      }
    }
  }

  return sequence;
}

/**
 * Fallback tokenizer for JavaScript when parsing fails.
 * @param {string} code
 * @returns {string[]}
 */
export function getFallbackStructuralSequence(code) {
  let cleanCode = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  cleanCode = cleanCode
    .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '')
    .replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, '');

  const sequence = [];
  const tokenRegex =
    /\b(function|for|while|do|if|else|switch|case|return|try|catch)\b|(\+\+|--|==|!=|<=|>=|&&|\|\||\+=|-=|\*=|\/=|%=|\+|-|\*|\/|%|=|<|>|!|\?|:)|([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\()/g;

  let match;
  while ((match = tokenRegex.exec(cleanCode)) !== null) {
    const [_, keyword, operator, call] = match;
    if (keyword) {
      if (keyword === 'function') sequence.push('FunctionDeclaration');
      else if (keyword === 'for') sequence.push('ForStatement');
      else if (keyword === 'while') sequence.push('WhileStatement');
      else if (keyword === 'do') sequence.push('DoWhileStatement');
      else if (keyword === 'if') sequence.push('IfStatement');
      else if (keyword === 'else') sequence.push('ElseStatement');
      else if (keyword === 'switch') sequence.push('SwitchStatement');
      else if (keyword === 'case') sequence.push('SwitchCase');
      else if (keyword === 'return') sequence.push('ReturnStatement');
      else if (keyword === 'try') sequence.push('TryStatement');
      else if (keyword === 'catch') sequence.push('CatchClause');
    } else if (operator) {
      if (['=', '+=', '-=', '*=', '/=', '%='].includes(operator)) {
        sequence.push('AssignmentExpression');
      } else {
        sequence.push(`Operator:${operator}`);
      }
    } else if (call) {
      const keywords = new Set(['if', 'for', 'while', 'switch', 'catch']);
      if (!keywords.has(call)) {
        sequence.push('CallExpression');
      }
    }
  }
  return sequence;
}

/**
 * Calculates the Levenshtein distance between two token sequences.
 * @param {string[]} seq1
 * @param {string[]} seq2
 * @returns {number}
 */
export function calculateLevenshteinDistance(seq1, seq2) {
  const m = seq1.length;
  const n = seq2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  let prevRow = Array.from({ length: n + 1 }, (_, i) => i);
  let currRow = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = seq1[i - 1] === seq2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(currRow[j - 1] + 1, prevRow[j] + 1, prevRow[j - 1] + cost);
    }
    prevRow = [...currRow];
  }

  return prevRow[n];
}

/**
 * Generates the similarity percentage between two token sequences.
 * @param {string[]} seq1
 * @param {string[]} seq2
 * @returns {number} similarity percentage between 0 and 100
 */
export function calculateSimilarity(seq1, seq2) {
  if (seq1.length === 0 && seq2.length === 0) return 100;
  const maxLength = Math.max(seq1.length, seq2.length);
  if (maxLength === 0) return 0;

  const distance = calculateLevenshteinDistance(seq1, seq2);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  return Math.round(similarity * 100) / 100;
}

/**
 * Runs background plagiarism check against previous solutions.
 * @param {string} battleId
 * @param {string} playerId
 * @param {string} code
 */
export async function checkAndFlagPlagiarism(battleId, playerId, code) {
  try {
    const firestore = getDb();
    let problemTitle = '';
    let otherSubmissions = [];

    if (firestore) {
      const battleRef = firestore.collection('battles').doc(battleId);
      const battleDoc = await battleRef.get();
      if (!battleDoc.exists) {
        console.warn(`[PLAGIARISM] Battle ${battleId} not found in Firestore.`);
        return;
      }
      const battleData = battleDoc.data();
      problemTitle = battleData.problemTitle || 'Unknown Problem';

      const battlesSnap = await firestore
        .collection('battles')
        .where('problemTitle', '==', problemTitle)
        .limit(100)
        .get();

      for (const doc of battlesSnap.docs) {
        if (doc.id === battleId) continue;
        const data = doc.data();
        const subs = data.submissions || {};
        for (const [pId, sub] of Object.entries(subs)) {
          if (pId === playerId) continue;
          if (sub && sub.code) {
            otherSubmissions.push({
              battleId: doc.id,
              playerId: pId,
              code: sub.code,
            });
          }
        }
      }
    } else {
      // Fallback local store check if Firestore is not active (e.g. testing)
      const DATA_DIR = path.join(process.cwd(), 'data');
      const EXECUTIONS_FILE = path.join(DATA_DIR, 'executions.json');
      try {
        const raw = await fs.readFile(EXECUTIONS_FILE, 'utf8');
        const execs = JSON.parse(raw || '[]');
        const currentExec = execs.find((e) => e.battleId === battleId) || {};
        problemTitle = currentExec.problemTitle || 'Test Problem';

        for (const exec of execs) {
          if (exec.battleId === battleId) continue;
          if (exec.problemTitle === problemTitle && exec.playerId !== playerId && exec.code) {
            otherSubmissions.push({
              battleId: exec.battleId,
              playerId: exec.playerId,
              code: exec.code,
            });
          }
        }
      } catch (e) {
        // No execution history, skip local comparison
      }
    }

    if (otherSubmissions.length === 0) return;

    const currentLang = detectLanguage(code);
    let seq1 = getStructuralSequence(code, currentLang);
    if (seq1.length > 500) seq1 = seq1.slice(0, 500);

    for (const otherSub of otherSubmissions) {
      const otherLang = detectLanguage(otherSub.code);
      let seq2 = getStructuralSequence(otherSub.code, otherLang);
      if (seq2.length > 500) seq2 = seq2.slice(0, 500);

      const similarity = calculateSimilarity(seq1, seq2);
      if (similarity >= 85.0) {
        const report = {
          battleId,
          problemTitle,
          playerId,
          playerCode: code,
          comparedToPlayerId: otherSub.playerId,
          comparedToBattleId: otherSub.battleId,
          comparedToCode: otherSub.code,
          similarityPercentage: similarity,
          createdAt: new Date().toISOString(),
          status: 'pending_review',
        };

        if (firestore) {
          const collName = COLLECTIONS.PLAGIARISM_REPORTS || 'plagiarism_reports';
          await firestore.collection(collName).add(report);
          console.log(
            `[PLAGIARISM] Flagged similarity ${similarity}% between user ${playerId} and ${otherSub.playerId}`
          );
        } else {
          const DATA_DIR = path.join(process.cwd(), 'data');
          const PLAGIARISM_REPORTS_FILE = path.join(DATA_DIR, 'plagiarism_reports.json');
          await fs.mkdir(DATA_DIR, { recursive: true });

          let reports = [];
          try {
            const raw = await fs.readFile(PLAGIARISM_REPORTS_FILE, 'utf8');
            reports = JSON.parse(raw || '[]');
          } catch (e) {
            // File might not exist yet; default to empty array.
          }

          reports.push(report);
          await fs.writeFile(PLAGIARISM_REPORTS_FILE, JSON.stringify(reports, null, 2));
          console.log(
            `[PLAGIARISM] [LOCAL] Flagged similarity ${similarity}% between user ${playerId} and ${otherSub.playerId}`
          );
        }
      }
    }
  } catch (err) {
    console.error('[PLAGIARISM] Plagiarism checking failed:', err);
  }
}
