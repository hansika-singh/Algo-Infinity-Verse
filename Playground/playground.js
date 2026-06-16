const output = document.getElementById("output");
const languageSelector = document.getElementById("language");

const editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/javascript");

const templates = {
    javascript: `// JavaScript Playground\n\nfunction greet(name) {\n  return \`Hello \${name}\`;\n}\n\nconsole.log(greet("Learner"));\n`,
    typescript: `// TypeScript Playground\n\ninterface User {\n  name: string;\n}\n\nconst user: User = {\n  name: "Learner"\n};\n\nconsole.log(user);\n`,
    dart: `// Dart Playground\n\nvoid main() {\n  print("Hello Learner");\n}\n`
};

let currentLanguage = "javascript";
const defaultCode = templates.javascript;

const codeStorage = {
    javascript: templates.javascript,
    typescript: templates.typescript,
    dart: templates.dart
};

editor.setValue(templates[currentLanguage], -1);

document.getElementById("runBtn").addEventListener("click", runCode);
document.getElementById("clearBtn").addEventListener("click", clearOutput);
document.getElementById("resetBtn").addEventListener("click", resetEditor);

languageSelector.addEventListener("change", (event) => {
    const selectedLang = event.target.value.toLowerCase();

    codeStorage[currentLanguage] = editor.getValue();

    currentLanguage = selectedLang;

    editor.setValue(codeStorage[currentLanguage], -1);

    editor.session.setMode(`ace/mode/${selectedLang}`);
});

function clearOutput() {
    output.textContent = "";
}

function resetEditor() {
    editor.setValue(templates[currentLanguage], -1);
    clearOutput();
}

function formatValue(value) {
    if (typeof value === "object" && value !== null) {
        try {
            return JSON.stringify(value, null, 2);
        } catch {
            return "[Object]";
        }
    }

    return String(value);
}

function createConsoleCapture() {
    const logs = [];
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error,
    };

    console.log = (...args) => {
        logs.push(args.map(formatValue).join(" "));
    };

    console.warn = (...args) => {
        logs.push("⚠️ " + args.map(formatValue).join(" "));
    };

    console.error = (...args) => {
        logs.push("❌ " + args.map(formatValue).join(" "));
    };

    return {
        logs,
        restore() {
            console.log = originalConsole.log;
            console.warn = originalConsole.warn;
            console.error = originalConsole.error;
        },
    };
}

const runners = {
    javascript: runJavaScript,
    typescript: runTypeScript,
    dart: runDart
};

function runCode() {
    const language = languageSelector.value.toLowerCase();
    const code = editor.getValue();

    if (runners[language]) {
        runners[language](code);
    } else {
        output.textContent = `❌ Runner for language "${language}" is not implemented.`;
    }
}

function runJavaScript(code) {
    clearOutput();
    output.textContent = "Running...\n";
    const capture = createConsoleCapture();

    try {
        const execute = new Function(code);
        const result = execute();

        if (result !== undefined) {
            capture.logs.push(formatValue(result));
        }

        output.textContent = capture.logs.join("\n") || "✅ Code executed successfully.";
    } catch (error) {
        output.textContent = `❌ ${error.name}: ${error.message}`;
    } finally {
        capture.restore();
    }
}

async function runTypeScript(code) {
    clearOutput();
    output.textContent = "Compiling and Running remotely via Judge0...";

    try {
        const response = await fetch(
            "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language_id: 74,
                    source_code: code
                })
            }
        );

        const result = await response.json();

        output.textContent =
            result.stdout ||
            result.stderr ||
            result.compile_output ||
            "✅ Code ran successfully with no terminal output.";

    } catch (err) {
        output.textContent = `❌ Network Error: ${err.message}`;
    }
}

async function runDart(code) {
    clearOutput();
    output.textContent = "Compiling and Running remotely via Judge0...";

    try {
        const response = await fetch(
            "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    language_id: 90,
                    source_code: code
                })
            }
        );

        const result = await response.json();

        output.textContent =
            result.stdout ||
            result.stderr ||
            result.compile_output ||
            "✅ Code ran successfully with no terminal output.";

    } catch (err) {
        output.textContent = `❌ Network Error: ${err.message}`;
    }
}