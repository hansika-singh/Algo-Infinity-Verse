import fs from 'fs';
import path from 'path';

const ROOT_DIR = 'c:/Users/Rushabh Mahajan/Documents/GitHub/Algo-Infinity-Verse';

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
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Dropdown links replacement
    const dropdownRegex = /<a href="(\.\.\/)?oop-learning\.html"([^>]*?)>Learn OOP<\/a>/gi;
    
    content = content.replace(dropdownRegex, (match, pathPrefix, attrs) => {
        pathPrefix = pathPrefix || '';
        let caAttrs = attrs.replace(/\bactive\b/g, '').trim();
        caAttrs = caAttrs.replace(/\s+/g, ' ');
        if (caAttrs && !caAttrs.startsWith(' ')) {
            caAttrs = ' ' + caAttrs;
        }
        
        return `<a href="${pathPrefix}oop-learning.html"${attrs}>Learn OOP</a>\n            <a href="${pathPrefix}computer-architecture.html"${caAttrs}>Learn Architecture</a>`;
    });

    // 2. Footer links replacement
    const footerRegex = /<li><a href="(\.\.\/)?oop-learning\.html">Learn OOP<\/a><\/li>/gi;
    content = content.replace(footerRegex, (match, pathPrefix) => {
        pathPrefix = pathPrefix || '';
        return `<li><a href="${pathPrefix}oop-learning.html">Learn OOP</a></li>\n              <li><a href="${pathPrefix}computer-architecture.html">Learn Architecture</a></li>`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated links in: ${path.relative(ROOT_DIR, file)}`);
    }
});
console.log('Finished updating files.');
