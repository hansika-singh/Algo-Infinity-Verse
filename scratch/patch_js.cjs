const fs = require('fs');

function patchJS(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Patch Toggle
    content = content.replace(
        'const targetId = btn.getAttribute("aria-controls");',
        'const targetId = btn.getAttribute("aria-controls") || btn.getAttribute("data-target");'
    );

    // Patch Copy Code
    content = content.replace(
        /const code = btn\.getAttribute\("data-code"\);\s*if \(!code\) return;/g,
        `let code = btn.getAttribute("data-code");
      if (!code) {
        const targetId = btn.getAttribute("data-target");
        if (targetId) {
            const block = document.getElementById(targetId);
            if (block) code = block.innerText;
        }
      }
      if (!code) return;`
    );

    fs.writeFileSync(file, content, 'utf8');
}

patchJS('divide-and-conquer-learning.js');
patchJS('bit-manipulation-learning.js');
console.log('JS files patched.');
