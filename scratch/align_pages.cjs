const fs = require('fs');

const prefixSumHtml = fs.readFileSync('prefix-sum-learning.html', 'utf8');

// 1. Extract Scroll-to-Top and Navbar
const navMatch = prefixSumHtml.match(/<!-- Scroll to Top Button -->[\s\S]*?<\/nav>/);
const navbarContent = navMatch ? navMatch[0] : '';

// 2. Extract Hero Section
const heroMatch = prefixSumHtml.match(/<!-- Hero Section -->[\s\S]*?<\/section>/);
let baseHeroContent = heroMatch ? heroMatch[0] : '';

function processPage(pageName, displayName, subtitleText, typingWords, statTargets) {
    const htmlFile = `${pageName}-learning.html`;
    const jsFile = `${pageName}-learning.js`;
    let htmlContent = fs.readFileSync(htmlFile, 'utf8');

    // Remove old nav
    htmlContent = htmlContent.replace(/<!-- Navigation Bar -->[\s\S]*?<\/nav>/, '<!-- NAV_PLACEHOLDER -->');
    // Remove scroll-to-top if it exists already (just in case)
    htmlContent = htmlContent.replace(/<!-- Scroll to Top Button -->[\s\S]*?<\/button>\s*/, '');
    
    // Inject new nav + scroll button
    htmlContent = htmlContent.replace('<!-- NAV_PLACEHOLDER -->', navbarContent);
    // Note: the prefix sum navbar has 'Learn Prefix Sum' as active. Let's make the current page active.
    htmlContent = htmlContent.replace(/class="dropdown-item active"/g, 'class="dropdown-item"');
    htmlContent = htmlContent.replace(new RegExp(`<a href="${htmlFile}" class="dropdown-item" role="menuitem">`), `<a href="${htmlFile}" class="dropdown-item active" role="menuitem">`);

    // Remove old hero
    htmlContent = htmlContent.replace(/<!-- Page Header -->[\s\S]*?<\/header>/, '<!-- HERO_PLACEHOLDER -->');
    
    let heroContent = baseHeroContent;
    heroContent = heroContent.replace('Prefix Sum Pattern', `${displayName} Pattern`);
    heroContent = heroContent.replace('Efficient Range Queries in O(1) Time', subtitleText);
    heroContent = heroContent.replace('typing-text_prefix_sum', `typing-text_${pageName === 'divide-and-conquer' ? 'dc' : 'bit'}`);
    heroContent = heroContent.replace('id="typingTextPrefixSum"', `id="typingText${pageName === 'divide-and-conquer' ? 'DC' : 'Bit'}"`);
    heroContent = heroContent.replace('href="#introduction"', 'href="#intro"');
    heroContent = heroContent.replace('href="#practice"', 'href="#practice-exercises"');
    
    // Replace stat targets
    const statMatches = heroContent.match(/data-target="\d+"/g);
    if (statMatches && statTargets.length === 3) {
        heroContent = heroContent.replace(statMatches[0], `data-target="${statTargets[0]}"`);
        heroContent = heroContent.replace(statMatches[1], `data-target="${statTargets[1]}"`);
        heroContent = heroContent.replace(statMatches[2], `data-target="${statTargets[2]}"`);
    }

    htmlContent = htmlContent.replace('<!-- HERO_PLACEHOLDER -->', heroContent);

    // Main Container -> Section
    const mainRegex = /<!-- Main Content Container -->\s*<main class="container" style="max-width: 1200px; margin: 0 auto; padding: 0 1rem;">/i;
    const prefix = pageName === 'divide-and-conquer' ? 'dc' : 'bit';
    const sectionStart = `<!-- ${displayName} Learning Section -->
    <section id="${pageName}-learning" class="section">
      <div class="container">
        <h2 class="section-title">
          <span class="title-icon">${pageName === 'divide-and-conquer' ? '✂️' : '⚡'}</span>
          Learn ${displayName}
        </h2>
        <p class="section-subtitle">
          ${subtitleText}
        </p>
        
        <!-- PROGRESS_PLACEHOLDER -->`;
        
    htmlContent = htmlContent.replace(mainRegex, sectionStart);
    
    // Move progress bar
    const progressRegex = new RegExp(`<!-- Overall Progress -->\\s*<div class="${prefix}-progress-bar">[\\s\\S]*?<\\/div>\\s*<\\/div>\\s*<\\/div>`);
    const progressMatch = htmlContent.match(progressRegex);
    if (progressMatch) {
        let pb = progressMatch[0];
        // Fix the id for count
        pb = pb.replace(`id="${prefix}-progress-text"`, `class="${prefix}-progress-text"`);
        pb = pb.replace(/<span class=".*?progress-text".*?>.*?<\/span>/, `<span class="${prefix}-progress-text"><span id="progressCount">0</span> / 5 topics completed</span>`);
        pb = pb.replace(`id="${prefix}-progress-fill"`, `id="progressFill"`);
        
        // Add role attributes
        pb = pb.replace(`<div class="${prefix}-progress-bar">`, `<div class="${prefix}-progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" aria-label="Learning progress">`);
        
        htmlContent = htmlContent.replace(progressMatch[0], '');
        htmlContent = htmlContent.replace('<!-- PROGRESS_PLACEHOLDER -->', pb);
    }

    // Change <main class="container... to section close
    htmlContent = htmlContent.replace(/<\/main>/, '      </div>\n    </section>');

    // Change <section id="..." class="dc-lesson"> to <article ... data-topic="X">
    let topicCount = 1;
    htmlContent = htmlContent.replace(new RegExp(`<section\\s+id="[^"]*"\\s+class="${prefix}-lesson">`, 'g'), (match) => {
        let res = match.replace('<section', '<article');
        res = res.replace('>', ` data-topic="${topicCount}">`);
        topicCount++;
        return res;
    });
    htmlContent = htmlContent.replace(new RegExp(`</section>\\s*(?=<!-- Lesson|<!-- Overall)`, 'g'), '</article>\n\n          ');
    htmlContent = htmlContent.replace(new RegExp(`</section>\\s*(?=</div>\\s*</div>\\s*</div>\\s*</section>)`), '</article>\n');

    fs.writeFileSync(htmlFile, htmlContent, 'utf8');

    // ---------------- JS Update ----------------
    let jsContent = fs.readFileSync('prefix-sum-learning.js', 'utf8');
    
    // Rename components in JS
    jsContent = jsContent.replace(/prefix-sum-learning/g, `${pageName}-learning`);
    jsContent = jsContent.replace(/typingTextPrefixSum/g, `typingText${pageName === 'divide-and-conquer' ? 'DC' : 'Bit'}`);
    jsContent = jsContent.replace(/prefix-sum-exercise/g, `${prefix}-exercise`);
    jsContent = jsContent.replace(/prefix-sum-code/g, `${prefix}-code`);
    jsContent = jsContent.replace(/prefix-sum-sidebar/g, `${prefix}-sidebar`);
    jsContent = jsContent.replace(/prefix-sum-lesson/g, `${prefix}-lesson`);
    jsContent = jsContent.replace(/prefix-sum-progress/g, `${prefix}-progress`);

    // Replace words
    const typingArr = JSON.stringify(typingWords, null, 4);
    jsContent = jsContent.replace(/const words = \[\s*[\s\S]*?\];/, `const words = ${typingArr};`);

    fs.writeFileSync(jsFile, jsContent, 'utf8');
    console.log(`Updated ${htmlFile} and ${jsFile}`);
}

processPage('divide-and-conquer', 'Divide & Conquer', 'Decompose complex problems into manageable sub-problems', ["Merge Sort", "Quick Sort", "Binary Search", "Master Theorem", "Sub-problems"], [5, 12, 4]);
processPage('bit-manipulation', 'Bit Manipulation', 'Optimize performance with binary operations', ["XOR Swaps", "Bit Masking", "Power of Two", "Shift Operators", "O(1) Tricks"], [4, 15, 6]);
