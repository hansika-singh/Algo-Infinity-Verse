/**
 * DSASearchEngine
 * A fully client-side full-text search engine using an inverted index.
 * Supports tokenization, fuzzy matching (Levenshtein distance), TF-IDF ranking, and keyword highlighting.
 */

class DSASearchEngine {
  constructor(problems, cacheKey = "dsa_search_index_v1") {
    this.problems = problems || [];
    this.cacheKey = cacheKey;
    this.index = {}; // term -> { docId: { tf, positions, fieldWeights } }
    this.docCounts = {}; // docId -> total terms
    this.docMappings = {}; // docId -> problem object
    this.termIdf = {}; // term -> IDF score
    this.stopWords = new Set(["a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in", "into", "is", "it", "no", "not", "of", "on", "or", "such", "that", "the", "their", "then", "there", "these", "they", "this", "to", "was", "will", "with"]);

    // Weights for different fields
    this.weights = {
      title: 5.0,
      tags: 4.0,
      description: 1.5,
      difficulty: 1.0,
      category: 2.0,
      constraints: 0.5
    };

    this.init();
  }

  init() {
    if (this.problems.length === 0) return;

    // Load from cache if possible
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Only use cache if the problem count matches (basic invalidation check)
        if (parsed.problemCount === this.problems.length) {
          this.index = parsed.index;
          this.docCounts = parsed.docCounts;
          this.termIdf = parsed.termIdf;
          this.problems.forEach(p => this.docMappings[p.id] = p);
          return;
        }
      }
    } catch (e) {
      void 0;
    }

    this.buildIndex();
  }

  tokenize(text) {
    if (!text) return [];
    // Convert to lowercase, remove non-alphanumeric
    const rawTokens = text.toLowerCase().split(/[^a-z0-9]+/);
    return rawTokens.filter(t => t.length > 1 && !this.stopWords.has(t));
  }

  buildIndex() {
    const N = this.problems.length;

    this.problems.forEach(problem => {
      this.docMappings[problem.id] = problem;
      this.docCounts[problem.id] = 0;
      
      const fields = {
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        category: problem.category,
        tags: (problem.tags || []).join(" "),
        constraints: (problem.constraints || []).join(" ")
      };

      Object.entries(fields).forEach(([field, text]) => {
        if (!text) return;
        const tokens = this.tokenize(text);
        const weight = this.weights[field] || 1;

        tokens.forEach((term, pos) => {
          this.docCounts[problem.id]++;
          if (!this.index[term]) {
            this.index[term] = {};
          }
          if (!this.index[term][problem.id]) {
            this.index[term][problem.id] = { tf: 0, positions: [], fieldWeights: 0 };
          }
          
          this.index[term][problem.id].tf++;
          this.index[term][problem.id].positions.push(pos);
          this.index[term][problem.id].fieldWeights += weight;
        });
      });
    });

    // Calculate IDF
    Object.keys(this.index).forEach(term => {
      const docFreq = Object.keys(this.index[term]).length;
      // standard IDF formula: log( N / (1 + df) )
      this.termIdf[term] = Math.log(N / (1 + docFreq)) + 1;
    });

    // Save to cache
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({
        problemCount: N,
        index: this.index,
        docCounts: this.docCounts,
        termIdf: this.termIdf
      }));
    } catch (e) {
      void 0;
    }
  }

  levenshteinDistance(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  findFuzzyMatches(term, threshold = 2) {
    if (this.index[term]) return [term];
    
    const matches = [];
    // Only fuzzy match for terms longer than 3 characters
    if (term.length > 3) {
      Object.keys(this.index).forEach(indexTerm => {
        // Optimize: lengths must be similar
        if (Math.abs(indexTerm.length - term.length) <= threshold) {
          const dist = this.levenshteinDistance(term, indexTerm);
          if (dist <= threshold) {
            matches.push(indexTerm);
          }
        }
      });
    }
    return matches;
  }

  escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  }

  escapeRegExp(text) {
    return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  highlightText(text, terms) {
    if (!text) return "";
    let highlighted = this.escapeHtml(text);
    // Sort terms by length descending so longer words match first
    const sortedTerms = [...terms].sort((a, b) => b.length - a.length);
    
    sortedTerms.forEach(term => {
      // Use regex to match whole words mostly, but simple replace for now with case insensitivity
      // Match the term but don't match inside HTML tags if possible (basic approach)
      const regex = new RegExp(`(${this.escapeRegExp(term)})(?![^<]*>)`, "gi");
      highlighted = highlighted.replace(regex, `<mark class="search-highlight">$1</mark>`);
    });
    return highlighted;
  }

  search(query) {
    if (!query || query.trim() === "") {
      return this.problems.map(p => ({ ...p, score: 0 }));
    }

    const queryTokens = this.tokenize(query);
    if (queryTokens.length === 0) {
      return this.problems.map(p => ({ ...p, score: 0 }));
    }

    const scores = {}; // docId -> score
    const matchedTerms = new Set();

    queryTokens.forEach(qTerm => {
      let termsToSearch = this.findFuzzyMatches(qTerm, qTerm.length > 5 ? 2 : 1);
      // If no fuzzy match, fallback to substring match across index terms
      if (termsToSearch.length === 0) {
        termsToSearch = Object.keys(this.index).filter(t => t.includes(qTerm));
      }

      termsToSearch.forEach(term => {
        matchedTerms.add(term);
        const docs = this.index[term];
        if (docs) {
          Object.keys(docs).forEach(docId => {
            const { tf, fieldWeights } = docs[docId];
            const tfNorm = tf / (this.docCounts[docId] || 1);
            const idf = this.termIdf[term] || 1;
            
            // TF-IDF * Field Weight
            const score = tfNorm * idf * fieldWeights;
            
            if (!scores[docId]) scores[docId] = 0;
            scores[docId] += score;
          });
        }
      });
    });

    const results = [];
    Object.keys(scores).forEach(docId => {
      const problem = this.docMappings[docId];
      if (problem) {
        // Clone problem and add highlights
        const resultItem = { ...problem, score: scores[docId] };
        if (matchedTerms.size > 0) {
          resultItem.highlightedTitle = this.highlightText(problem.title, matchedTerms);
          // Highlight description, but keep it brief or just highlight what is there
          resultItem.highlightedDescription = this.highlightText(problem.description, matchedTerms);
        }
        results.push(resultItem);
      }
    });

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);
    return results;
  }
}

// Export if using modules, but since it's vanilla, it will attach to window
if (typeof window !== 'undefined') {
  window.DSASearchEngine = DSASearchEngine;
}
