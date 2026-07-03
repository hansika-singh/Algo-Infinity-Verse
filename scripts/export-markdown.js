// scripts/export-markdown.js

/**
 * Exports a solved problem and its accepted solution as a Markdown file.
 * @param {Object} problem - The problem object from practiceProblems
 * @param {Object} solution - The user's submitted solution from userProgress.submittedSolutions
 */
function exportProblemAsMarkdown(problem, solution) {
    if (!problem) return;

    const title = problem.title || "Unknown Problem";
    const difficulty = problem.difficulty || "Unspecified";
    const tags = problem.tags ? problem.tags.join(", ") : "None";
    
    // Fallback if no solution was saved (for problems solved before this feature)
    const code = solution?.code || "// No solution code was saved for this submission.";
    const lang = solution?.lang || "javascript";
    const date = solution?.date ? new Date(solution.date).toLocaleDateString() : "Unknown";

    // Clean up HTML in description for Markdown
    let markdownDescription = problem.description || "No description provided.";
    markdownDescription = markdownDescription
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<strong>(.*?)<\/strong>/gi, "**$1**")
        .replace(/<em>(.*?)<\/em>/gi, "*$1*")
        .replace(/<code>(.*?)<\/code>/gi, "`$1`")
        .replace(/<[^>]*>?/gm, ""); // strip remaining HTML tags

    // Constraints formatting
    let constraintsMarkdown = "";
    if (problem.constraints && problem.constraints.length > 0) {
        constraintsMarkdown = `\n## Constraints\n${problem.constraints.map(c => `- ${c}`).join('\n')}\n`;
    }

    // Generate Markdown Content
    const markdownContent = `# ${title}

## Metadata
- **Difficulty:** ${difficulty}
- **Topics/Tags:** ${tags}
- **Solved Date:** ${date}
- **Language:** ${lang}

## Description
${markdownDescription}
${constraintsMarkdown}
## Accepted Solution

\`\`\`${lang}
${code}
\`\`\`

---
*Exported from Algo Infinity Verse*
`;

    // Trigger Download
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '-').toLowerCase()}-solution.md`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (typeof showNotification === 'function') {
        showNotification("Markdown exported successfully!", "success");
    }
}

// Make it globally available
window.exportProblemAsMarkdown = exportProblemAsMarkdown;
