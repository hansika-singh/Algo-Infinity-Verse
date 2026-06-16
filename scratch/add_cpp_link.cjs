const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('scratch')) {
                results = results.concat(walk(fullPath));
            }
        } else {
            if (fullPath.endsWith('.html')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const htmlFiles = walk('.');

htmlFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    const prefix = file.includes('support-page') ? '../' : '';

    if (content.includes('scala-editor.html') && !content.includes('cpp-editor.html" class="dropdown-item"')) {
        content = content.replace(
            /(<a href="(?:\.\.\/)?scala-editor\.html"[^>]*>.*?<\/a>)/g,
            '$1\n            <a href="' + prefix + 'cpp-editor.html" class="dropdown-item" role="menuitem">C++ Editor</a>'
        );
        modified = true;
    }

    if (content.includes('scala-editor.html') && !content.includes('cpp-editor.html">C++ Editor')) {
        content = content.replace(
            /(<li><a href="(?:\.\.\/)?scala-editor\.html"[^>]*>.*?<\/a><\/li>)/g,
            '$1\n              <li><a href="' + prefix + 'cpp-editor.html">C++ Editor</a></li>'
        );
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
