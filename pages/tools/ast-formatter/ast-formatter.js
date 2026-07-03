/**
 * ast-formatter.js
 * Logic for the AST Code Formatter Tool.
 */

document.addEventListener("DOMContentLoaded", () => {
    // Initial dummy code for the editor
    const initialCode = `function calculateTotal( items){
let total=0;
for(let i =0;i<items.length; i++){
total +=items[i].price* items[i].quantity;
    if(items[i].discount) {
 total-= items[i].discount
}
}
return  total;
}

const cart=[{price: 10,quantity: 2},{price: 5,quantity:1, discount: 2}];
console.log(calculateTotal(cart))`;

    // 1. Initialize CodeMirror Instances
    const inputEditor = CodeMirror(document.getElementById("inputEditorContainer"), {
        lineNumbers: true,
        mode: "javascript",
        theme: "material-palenight",
        value: initialCode,
        indentUnit: 4,
        matchBrackets: true,
        autoCloseBrackets: true
    });

    const outputEditor = CodeMirror(document.getElementById("outputEditorContainer"), {
        lineNumbers: true,
        mode: "javascript",
        theme: "material-palenight",
        value: "",
        readOnly: true
    });

    // Elements
    const btnFormat = document.getElementById("btnFormat");
    const btnReset = document.getElementById("btnReset");
    const btnCopy = document.getElementById("btnCopy");
    const btnReplace = document.getElementById("btnReplace");
    const errorBanner = document.getElementById("errorBanner");
    
    const indentStyle = document.getElementById("indentStyle");
    const quoteStyle = document.getElementById("quoteStyle");
    const semiStyle = document.getElementById("semiStyle");

    // 2. Format Logic
    function formatCode() {
        const rawCode = inputEditor.getValue();
        errorBanner.classList.add("hidden");

        if (!rawCode.trim()) {
            outputEditor.setValue("");
            return;
        }

        try {
            // Construct Prettier Formatting Options
            let tabWidth = 4;
            let useTabs = false;
            
            if (indentStyle.value === "2spaces") tabWidth = 2;
            else if (indentStyle.value === "tab") useTabs = true;

            const options = {
                parser: "babel",
                plugins: prettierPlugins,
                tabWidth: tabWidth,
                useTabs: useTabs,
                singleQuote: quoteStyle.value === "single",
                semi: semiStyle.value === "true",
            };

            // Generate Formatted Code using Prettier (AST internally)
            const formattedCode = prettier.format(rawCode, options);
            outputEditor.setValue(formattedCode);

        } catch (error) {
            // Display Syntax Error
            errorBanner.textContent = `Syntax Error: ${error.message}`;
            errorBanner.classList.remove("hidden");
            console.error("AST Parsing Error:", error);
        }
    }

    // 3. Event Listeners
    btnFormat.addEventListener("click", formatCode);

    // Auto-format on setting change
    indentStyle.addEventListener("change", formatCode);
    quoteStyle.addEventListener("change", formatCode);
    semiStyle.addEventListener("change", formatCode);

    btnReset.addEventListener("click", () => {
        if(confirm("Reset to default example code?")) {
            inputEditor.setValue(initialCode);
            errorBanner.classList.add("hidden");
            outputEditor.setValue("");
            formatCode();
        }
    });

    btnCopy.addEventListener("click", () => {
        const val = outputEditor.getValue();
        if (val) {
            navigator.clipboard.writeText(val).then(() => {
                const icon = btnCopy.innerHTML;
                btnCopy.innerHTML = `<i class="fas fa-check"></i>`;
                setTimeout(() => btnCopy.innerHTML = icon, 2000);
            });
        }
    });

    btnReplace.addEventListener("click", () => {
        const val = outputEditor.getValue();
        if (val) {
            inputEditor.setValue(val);
        }
    });

    // Initial formatting run
    setTimeout(formatCode, 100);
});
