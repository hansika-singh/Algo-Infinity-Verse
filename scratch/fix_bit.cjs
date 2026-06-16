const fs = require('fs');

function fixClasses(file) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace class and id names
    content = content.replace(/class="bit-manipulation-/g, 'class="bit-');
    content = content.replace(/id="bit-manipulation-/g, 'id="bit-');
    content = content.replace(/\.bit-manipulation-/g, '.bit-');
    
    // Fix progress bar in HTML
    if (file.endsWith('.html')) {
        content = content.replace('<!-- PROGRESS_PLACEHOLDER -->', `<div class="bit-progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Learning progress">
          <span class="bit-progress-text"><span id="progressCount">0</span> / 5 topics completed</span>
          <div class="bit-progress-track">
            <div class="bit-progress-fill" id="progressFill"></div>
          </div>
        </div>`);
        
        // Remove the old progress bar from the bottom
        const oldProgressRegex = /<!-- Overall Progress -->\s*<div class="bit-progress-bar">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
        content = content.replace(oldProgressRegex, '');
    }

    fs.writeFileSync(file, content, 'utf8');
}

fixClasses('bit-manipulation-learning.html');
fixClasses('bit-manipulation-learning.css');
console.log('Bit manipulation classes fixed.');
