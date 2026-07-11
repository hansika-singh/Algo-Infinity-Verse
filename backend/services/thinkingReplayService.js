const OpenAI = require('openai');

class ThinkingReplayService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateReplay(snapshots, events, submissions) {
    try {
      // 1. Prepare data for AI
      const analysisData = this.prepareAnalysisData(snapshots, events, submissions);
      
      // 2. Generate prompt for AI
      const prompt = this.buildPrompt(analysisData);
      
      // 3. Call LLM
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: "You are an expert analyzing problem-solving strategies." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      // 4. Parse response
      const replay = this.parseResponse(response.choices[0].message.content);
      
      return replay;
    } catch (error) {
      console.error('AI Replay generation failed:', error);
      return this.generateFallbackReplay(snapshots);
    }
  }

  prepareAnalysisData(snapshots, events, submissions) {
    return {
      snapshots: snapshots.map(s => ({
        timestamp: s.timestamp,
        code: s.code,
        status: s.status,
        executionTime: s.execution_time,
        errors: s.errors
      })),
      events: events.map(e => ({
        type: e.type,
        timestamp: e.timestamp
      })),
      submissions: submissions.map(s => ({
        status: s.status,
        timestamp: s.timestamp,
        results: s.results
      }))
    };
  }

  buildPrompt(data) {
    return `
Analyze this coding session and reconstruct the thinking process.

Snapshots (chronological):
${data.snapshots.map((s, i) => `
Step ${i+1} [${s.timestamp}]:
Status: ${s.status}
Code: ${s.code.substring(0, 200)}${s.code.length > 200 ? '...' : ''}
${s.errors ? `Errors: ${s.errors}` : ''}
Execution Time: ${s.executionTime || 'N/A'}ms
`).join('\n')}

Editor Events: ${data.events.length} events tracked
Submissions: ${data.submissions.length} submissions

Tasks:
1. Identify the strategy at each step (Brute Force, Sliding Window, DP, etc.)
2. Explain why strategy changed
3. Analyze performance improvements
4. Suggest better alternatives

Generate response as JSON:
{
  "timeline": [
    {
      "timestamp": "10:03",
      "strategy": "Brute Force",
      "reasoning": "Started with simplest approach",
      "code": "// code snippet",
      "performance": { "time": "O(n²)", "space": "O(1)" }
    }
  ],
  "reasoningSummary": "The user started with brute force...",
  "strategyComparison": {
    "from": "Brute Force",
    "to": "Sliding Window",
    "improvement": "Reduced time from O(n²) to O(n)"
  },
  "performanceAnalysis": {
    "optimizations": ["Removed nested loops", "Used prefix sum"],
    "suggestions": ["Consider DP approach"],
    "timeComplexity": "O(n)",
    "spaceComplexity": "O(1)"
  },
  "strategyTags": ["brute_force", "sliding_window", "prefix_sum"]
}`;
  }

  parseResponse(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.generateFallbackReplay();
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.generateFallbackReplay();
    }
  }

  generateFallbackReplay(snapshots) {
    return {
      timeline: snapshots.map((s, i) => ({
        timestamp: s.timestamp || new Date().toLocaleTimeString(),
        strategy: i === 0 ? 'Initial Approach' : 'Continued Work',
        reasoning: i === 0 ? 'Started solving the problem' : 'Refined solution',
        code: s.code?.substring(0, 50) || '',
        performance: { time: 'O(n)', space: 'O(1)' }
      })),
      reasoningSummary: 'User worked on the problem and made progress.',
      strategyComparison: {
        from: 'Initial',
        to: 'Final',
        improvement: 'Improved solution'
      },
      performanceAnalysis: {
        optimizations: ['Code improvements'],
        suggestions: ['Review alternative approaches'],
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)'
      },
      strategyTags: ['initial', 'final']
    };
  }
}

module.exports = ThinkingReplayService;