import { MarkdownParser } from '../utils/markdownParser.js';
import assert from 'assert';

function runTests() {
  console.log('Running Next-Level Feature Tests for MarkdownParser...');
  
  let failures = 0;
  
  function check(name, html, expectedSnippet, unexpectedSnippet = null) {
    let passed = true;
    if (!html.includes(expectedSnippet)) {
      console.error(`❌ [FAILED] ${name}`);
      console.error(`   Expected to find: ${expectedSnippet}`);
      console.error(`   Actual HTML: ${html}`);
      failures++;
      passed = false;
    } else if (unexpectedSnippet && html.includes(unexpectedSnippet)) {
      console.error(`❌ [FAILED] ${name}`);
      console.error(`   Expected NOT to find: ${unexpectedSnippet}`);
      console.error(`   Actual HTML: ${html}`);
      failures++;
      passed = false;
    } else {
      console.log(`✅ [PASSED] ${name}`);
    }
    return passed;
  }

  // 1. Task Lists
  const taskListMd = `- [ ] Unchecked task\n- [x] Checked task\n- [X] Also checked`;
  const taskHtml = MarkdownParser.parse(taskListMd);
  check('Task list unchecked', taskHtml, 'type="checkbox" disabled  class="task-list-item-checkbox"> Unchecked task');
  check('Task list checked (lowercase x)', taskHtml, 'type="checkbox" disabled checked class="task-list-item-checkbox"> Checked task');
  check('Task list checked (uppercase X)', taskHtml, 'type="checkbox" disabled checked class="task-list-item-checkbox"> Also checked');
  check('Task list item class', taskHtml, '<li class="task-list-item">');

  // 2. Strikethrough
  const strikeMd = 'This is ~~deleted~~ text.';
  check('Strikethrough rendering', MarkdownParser.parse(strikeMd), '<del>deleted</del>');

  // 3. Highlight
  const markMd = 'This is ==important== text.';
  check('Highlight rendering', MarkdownParser.parse(markMd), '<mark>important</mark>');

  // 4. Plugin Architecture
  // Add a custom plugin
  MarkdownParser.addExtension({
    name: 'customAuthor',
    regex: /@([a-zA-Z0-9_-]+)/g,
    replacer: (match, username) => `<a href="/users/${username}" class="mention">@${username}</a>`
  });

  const mentionMd = 'Hello @Madhavi1108';
  check('Custom plugin execution (mentions)', MarkdownParser.parse(mentionMd), '<a href="/users/Madhavi1108" class="mention">@Madhavi1108</a>');

  if (failures === 0) {
    console.log('\\nAll next-level features passed successfully! 🎉');
    process.exit(0);
  } else {
    console.error(`\\n${failures} tests failed. Needs fixing.`);
    process.exit(1);
  }
}

runTests();
