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

    // Navbar dropdown insertion (after pathfinding-visualizer or sorting-visualizer)
    if (content.includes('pathfinding-visualizer.html') && !content.includes('complexity-calculator.html" class="dropdown-item"')) {
        content = content.replace(
            /(<a href="(?:\.\.\/)?pathfinding-visualizer\.html"[^>]*>.*?<\/a>)/g,
            '$1\n            <a href="' + prefix + 'complexity-calculator.html" class="dropdown-item" role="menuitem">Complexity Calculator</a>'
        );
        modified = true;
    }

    // Footer insertion
    if (content.includes('pathfinding-visualizer.html') && !content.includes('complexity-calculator.html">Complexity')) {
        content = content.replace(
            /(<li>\s*<a href="(?:\.\.\/)?pathfinding-visualizer\.html"[^>]*>.*?<\/a>\s*<\/li>)/g,
            '$1\n              <li><a href="' + prefix + 'complexity-calculator.html">Complexity Calculator</a></li>'
        );
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
