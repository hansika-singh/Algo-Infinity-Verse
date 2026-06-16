import fs from 'fs';
import path from 'path';

const ROOT_DIR = process.cwd();

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== '.gemini' && file !== '.vscode' && file !== '.github') {
                results = results.concat(getFiles(filePath));
            }
        } else {
            if (file.endsWith('.html') || file.endsWith('.php')) {
                results.push(filePath);
            }
        }
    });
    return results;
}

const files = getFiles(ROOT_DIR);
console.log(`Found ${files.length} HTML/PHP files to process.`);

files.forEach(file => {
    // Skip the pathfinding visualizer file itself as it already has the correct active/inactive classes
    if (file.endsWith('pathfinding-visualizer.html')) {
        return;
    }

    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Dropdown links replacement
    const dropdownRegex = /<a href="(\.\.\/)?graph-visualizer\.html"([^>]*?)>Graph Visualizer<\/a>/gi;
    
    content = content.replace(dropdownRegex, (match, pathPrefix, attrs) => {
        pathPrefix = pathPrefix || '';
        const pathfindingHref = `${pathPrefix}pathfinding-visualizer.html`;
        if (content.includes(`href="${pathfindingHref}"`)) return match;
        let pathfindingAttrs = attrs.replace(/\bactive\b/g, '').trim();
        pathfindingAttrs = pathfindingAttrs.replace(/\s+/g, ' ');
        if (pathfindingAttrs && !pathfindingAttrs.startsWith(' ')) {
            pathfindingAttrs = ' ' + pathfindingAttrs;
        }
        
        return `<a href="${pathPrefix}graph-visualizer.html"${attrs}>Graph Visualizer</a>\n            <a href="${pathPrefix}pathfinding-visualizer.html"${pathfindingAttrs}>Pathfinding Visualizer</a>`;
    });

    // 2. Footer links replacement
    const footerRegex = /<li><a href="(\.\.\/)?graph-visualizer\.html">Graph Visualizer<\/a><\/li>/gi;
    content = content.replace(footerRegex, (match, pathPrefix) => {
        pathPrefix = pathPrefix || '';
        const pathfindingHref = `${pathPrefix}pathfinding-visualizer.html`;
        if (content.includes(`href="${pathfindingHref}"`)) return match;
        return `<li><a href="${pathPrefix}graph-visualizer.html">Graph Visualizer</a></li>\n              <li><a href="${pathPrefix}pathfinding-visualizer.html">Pathfinding Visualizer</a></li>`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated links in: ${path.relative(ROOT_DIR, file)}`);
    }
});
console.log('Finished updating files.');
