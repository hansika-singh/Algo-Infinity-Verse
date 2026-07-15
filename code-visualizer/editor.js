// ====== EDITOR SETUP ======
const codeEditor = document.getElementById('codeEditor');
const lineNumbers = document.getElementById('lineNumbers');

// ====== DEFAULT CODE ======
const defaultCode = `// Simple code to trace
let x = 5;
let y = 10;
let sum = x + y;
console.log(sum);
console.log("Done!");`;

codeEditor.value = defaultCode;

// ====== UPDATE LINE NUMBERS ======
function updateLineNumbers() {
    const lines = codeEditor.value.split('\n');
    const count = lines.length;
    let html = '';
    for (let i = 1; i <= count; i++) {
        html += `<span>${i}</span>`;
    }
    lineNumbers.innerHTML = html;
}

// ====== SYNC SCROLLING ======
codeEditor.addEventListener('scroll', () => {
    lineNumbers.scrollTop = codeEditor.scrollTop;
});

codeEditor.addEventListener('input', updateLineNumbers);

// ====== TAB SUPPORT ======
codeEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = codeEditor.selectionStart;
        const end = codeEditor.selectionEnd;
        codeEditor.value = codeEditor.value.substring(0, start) + '  ' + codeEditor.value.substring(end);
        codeEditor.selectionStart = codeEditor.selectionEnd = start + 2;
        updateLineNumbers();
    }
});

// ====== INIT ======
updateLineNumbers();

window.addEventListener("resize", () => {
  if (typeof updateLineNumbers === 'function') updateLineNumbers();
});
