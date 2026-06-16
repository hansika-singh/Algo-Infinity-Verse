import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve(import.meta.dirname, '..');

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (!['node_modules', '.git', '.gemini', '.vscode', '.github', 'scratch'].includes(file)) {
                results = results.concat(getFiles(filePath));
            }
        } else if (file.endsWith('.html')) {
            results.push(filePath);
        }
    });
    return results;
}

const files = getFiles(ROOT_DIR);
console.log(`Found ${files.length} HTML files to process.`);

let updated = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Skip files that already have the link
    if (content.includes('recursion-tree-visualizer.html')) {
        return;
    }

    // 1. Navbar dropdown: insert after pathfinding-visualizer link
    //    Handles: class="dropdown-item", class="dropdown-item active", class="dropdown-item "
    const navRegex = /(<a href="(\.\.\/)?pathfinding-visualizer\.html" class="dropdown-item[^"]*"[^>]*>Pathfinding Visualizer<\/a>)/i;
    const navMatch = content.match(navRegex);
    if (navMatch) {
        const fullMatch = navMatch[1];
        const pathPrefix = navMatch[2] || '';
        content = content.replace(fullMatch,
            `${fullMatch}\n            <a href="${pathPrefix}recursion-tree-visualizer.html" class="dropdown-item" role="menuitem">Recursion Tree Visualizer</a>`
        );
    }

    // 2. Footer: insert after pathfinding-visualizer link
    //    Handles: <li><a href="...">...</a></li> and bare <a href="...">...</a>
    const footerLiRegex = /(<li><a href="(\.\.\/)?pathfinding-visualizer\.html">Pathfinding Visualizer<\/a><\/li>)/i;
    const footerLiMatch = content.match(footerLiRegex);
    if (footerLiMatch) {
        const fullMatch = footerLiMatch[1];
        const pathPrefix = footerLiMatch[2] || '';
        content = content.replace(fullMatch,
            `${fullMatch}\n              <li><a href="${pathPrefix}recursion-tree-visualizer.html">Recursion Tree Visualizer</a></li>`
        );
    } else {
        // Try bare <a> in footer (no <li> wrapper)
        const footerRegex = /(<a href="(\.\.\/)?pathfinding-visualizer\.html">Pathfinding Visualizer<\/a>)/i;
        const footerMatch = content.match(footerRegex);
        if (footerMatch && !navRegex.test(footerMatch[1])) {
            // This is a footer link (not the navbar one we already handled)
            const fullMatch = footerMatch[1];
            const pathPrefix = footerMatch[2] || '';
            content = content.replace(fullMatch,
                `${fullMatch}\n              <a href="${pathPrefix}recursion-tree-visualizer.html">Recursion Tree Visualizer</a>`
            );
        }
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        updated++;
        console.log(`Updated: ${path.relative(ROOT_DIR, file)}`);
    }
});

console.log(`\nDone. Updated ${updated} files.`);
