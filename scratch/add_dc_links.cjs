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
            if (fullPath.endsWith('.html') && !fullPath.includes('divide-and-conquer-learning.html') && !fullPath.includes('sliding-window-learning.html') && !fullPath.includes('bit-manipulation-learning.html') && !fullPath.includes('prefix-sum-learning.html')) {
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

    // Dropdown addition (after DBMS)
    if (content.includes('dbms-learning.html') && !content.includes('href="' + prefix + 'divide-and-conquer-learning.html"  class="dropdown-item"')) {
        content = content.replace(
            /(<a href="(?:\.\.\/)?dbms-learning\.html"\s*class="dropdown-item"[^>]*>.*?<\/a>)/g,
            '$1\n            <a href="' + prefix + 'divide-and-conquer-learning.html"  class="dropdown-item">Learn Divide &amp; Conquer</a>'
        );
        modified = true;
    }

    // Footer addition (after DBMS)
    if (content.includes('dbms-learning.html') && !content.includes('<li><a href="' + prefix + 'divide-and-conquer-learning.html"')) {
        content = content.replace(
            /(<li><a href="(?:\.\.\/)?dbms-learning\.html"(?:\s*class="[^"]*")?[^>]*>.*?<\/a><\/li>)/g,
            '$1\n              <li><a href="' + prefix + 'divide-and-conquer-learning.html">Learn Divide &amp; Conquer</a></li>'
        );
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
