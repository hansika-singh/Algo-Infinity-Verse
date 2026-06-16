import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve('c:/Users/Rushabh Mahajan/Documents/GitHub/Algo-Infinity-Verse').replace(/\\/g, '/');

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

// List of all learn items in order
const learnItems = [
    { href: 'index.html#topics', text: 'DSA Topics' },
    { href: 'index.html#practice', text: 'Practice Problems' },
    { href: 'index.html#quiz', text: 'Quizzes' },
    { href: 'index.html#roadmap', text: 'Learning Roadmap' },
    { href: 'python-learning.html', text: 'Learn Python' },
    { href: 'javascript-learning.html', text: 'Learn JavaScript' },
    { href: 'java-learning.html', text: 'Learn Java' },
    { href: 'cplusplus-learning.html', text: 'Learn C++' },
    { href: 'c-learning.html', text: 'Learn C' },
    { href: 'dbms-learning.html', text: 'Learn DBMS' },
    { href: 'powerbi-learning.html', text: 'Learn Power BI' },
    { href: 'php-learning.html', text: 'Learn PHP' },
    { href: 'oop-learning.html', text: 'Learn OOP' },
    { href: 'computer-architecture.html', text: 'Learn Architecture' },
    { href: 'tree-traversal.html', text: 'Tree Traversal' },
    { href: 'sorting-visualizer.html', text: 'Sorting Visualizer' },
    { href: 'graph-visualizer.html', text: 'Graph Visualizer' }
];

// List of all resources items in footer Resources section
const resourceItems = [
    { href: '#', text: 'Documentation' },
    { href: '#', text: 'Blog' },
    { href: 'community.html', text: 'Community' },
    { href: 'cheat-sheets.html', text: 'DSA Cheat Sheets' },
    { href: 'python-learning.html', text: 'Learn Python' },
    { href: 'javascript-learning.html', text: 'Learn JavaScript' },
    { href: 'java-learning.html', text: 'Learn Java' },
    { href: 'cplusplus-learning.html', text: 'Learn C++' },
    { href: 'c-learning.html', text: 'Learn C' },
    { href: 'dbms-learning.html', text: 'Learn DBMS' },
    { href: 'php-learning.html', text: 'Learn PHP' },
    { href: 'oop-learning.html', text: 'Learn OOP' },
    { href: 'computer-architecture.html', text: 'Learn Architecture' },
    { href: 'tree-traversal.html', text: 'Tree Traversal' },
    { href: 'sorting-visualizer.html', text: 'Sorting Visualizer' },
    { href: 'graph-visualizer.html', text: 'Graph Visualizer' },
    { href: 'resume.html', text: 'Coding Resume' },
    { href: 'support-page/index.html', text: 'Support' },
    { href: 'feedback.html', text: 'Feedback' },
    { href: 'about-us.html', text: 'About us' },
    { href: 'privacy-policy.html', text: 'Privacy' }
];

function getRelativePath(targetFile, currentFilePath) {
    if (targetFile === '#' || targetFile.startsWith('#')) {
        return targetFile;
    }
    
    const hashIndex = targetFile.indexOf('#');
    const filePart = hashIndex !== -1 ? targetFile.substring(0, hashIndex) : targetFile;
    const anchorPart = hashIndex !== -1 ? targetFile.substring(hashIndex) : '';
    
    const normalizedCurrentFile = currentFilePath.replace(/\\/g, '/');
    const currentDir = path.dirname(normalizedCurrentFile);
    
    const isCurrentIndex = (filePart === 'index.html' && path.basename(normalizedCurrentFile) === 'index.html' && currentDir === ROOT_DIR);
    if (isCurrentIndex && anchorPart) {
        return anchorPart;
    }
    
    const targetAbsPath = path.resolve(ROOT_DIR, filePart).replace(/\\/g, '/');
    let relPath = path.relative(currentDir, targetAbsPath);
    relPath = relPath.replace(/\\/g, '/');
    
    return relPath + anchorPart;
}

files.forEach(file => {
    const normalizedFile = file.replace(/\\/g, '/');
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Dropdown links replacement
    const dropdownRegex = /(<li class="nav-item has-dropdown">\s*<button class="nav-link dropdown-toggle"[^>]*>\s*<span>Learn<\/span>[\s\S]*?<div class="dropdown-menu"[^>]*>)([\s\S]*?)(<\/div>)/i;
    
    content = content.replace(dropdownRegex, (match, openTag, oldLinks, closeTag) => {
        const newLinks = learnItems.map(item => {
            const relHref = getRelativePath(item.href, normalizedFile);
            
            // Check if active
            const hashIndex = item.href.indexOf('#');
            const filePart = hashIndex !== -1 ? item.href.substring(0, hashIndex) : item.href;
            const targetAbsPath = path.resolve(ROOT_DIR, filePart).replace(/\\/g, '/');
            
            let isActive = (normalizedFile === targetAbsPath);
            // Don't mark index.html links active if we are on index.html, as it's a general index with several anchor links
            if (filePart === 'index.html' && path.basename(normalizedFile) === 'index.html' && path.dirname(normalizedFile) === ROOT_DIR) {
                isActive = false;
            }
            
            const className = isActive ? 'dropdown-item active' : 'dropdown-item';
            const hasRole = oldLinks.includes('role="menuitem"');
            const roleAttr = hasRole ? ' role="menuitem"' : '';
            
            return `            <a href="${relHref}" class="${className}"${roleAttr}>${item.text}</a>`;
        }).join('\n');
        
        return `${openTag}\n${newLinks}\n          ${closeTag}`;
    });

    // 2. Footer links replacement
    const footerRegex = /(<h4>Resources<\/h4>\s*<ul>)([\s\S]*?)(<\/ul>)/i;
    content = content.replace(footerRegex, (match, openTag, oldLinks, closeTag) => {
        const newLinks = resourceItems.map(item => {
            const relHref = getRelativePath(item.href, normalizedFile);
            return `              <li><a href="${relHref}">${item.text}</a></li>`;
        }).join('\n');
        
        return `${openTag}\n${newLinks}\n            ${closeTag}`;
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated links in: ${path.relative(ROOT_DIR, file)}`);
    }
});
console.log('Finished updating files.');
