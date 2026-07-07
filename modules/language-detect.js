function detectLanguage(code) {
  const patterns = {
        javascript: /function\s*\(|const\s+\w+\s*=|let\s+\w+\s*=|=>|console\.log/,
        python: /def\s+\w+\s*\(|import\s+\w+|print\(|if\s+__name__\s*==/,
        java: /public\s+class|System\.out\.println|public\s+static\s+void\s+main/,
        cpp: /#include\s*<.*>|using\s+namespace\s+std|std::/,
        html: /<!DOCTYPE\s+html|<html|<body|<div\s+class/,
        css: /{[\s\S]*;[\s\S]*}/,
        sql: /SELECT.*FROM|INSERT\s+INTO|UPDATE.*SET|DELETE\s+FROM/,
        php: /<\?php|\$[a-zA-Z_]/,
        ruby: /def\s+\w+|end|puts\s+/,
        go: /package\s+main|func\s+main\(\)|import\s*\(/,
        rust: /fn\s+main\(\)|let\s+mut|println!/
    };

    for(const[lang,pattern] of Object.entries(patterns)) {
      if(pattern.test(code)) return lang;
    }
    return 'text';
    }

    function addLanguageBadges(){
      document.querySelectorAll('pre code').forEach(codcodeBlock => {
        const code = codcodeBlock.textContent;
        const lang = detectLanguage(code);
        const pre = codcodeBlock.closest('pre');
        const container = pre.closest('.code-block')|| pre.parentElement;
        container.style.position='relative';
        container.style.background='#1a1e2f';
        container.style.borderRadius = '8px';
        container.style.overflow = 'hidden';

        const badge = document.createElement('span');
        badge.className = `language-badge ${lang}`;
        badge.textContent = lang;
        container.appendChild(badge);
      });
    }

export function initLanguageDetect() {
    addLanguageBadges();
}
// Legacy global exports
window.initLanguageDetect = initLanguageDetect;
