export class CodingPersonalityAnalyzer{
    constructor(userData){
        this.userData = userData;
    }

analyze() {
    //Calculate metrics
    const metrics = this.calculateMetrics();

    //Apply rules
    const traits = this.getTraits(metrics);

    return {
        traits,
        metrics,
        description: this.generateDescription(traits)
    };
}

calculateMetrics() {
    const {problems, submissions, languages, topics, streak} = this.userData;
    return {
      speed: this.getSpeed(submissions),
      accuracy: this.getAccuracy(submissions),
      variety: this.getVariety(topics),
      persistence: streak > 30 ? 90 : streak > 15 ? 70 : 50,
      graphProficiency: this.getTopicScore(topics, 'graph'),
      mathProficiency: this.getTopicScore(topics, 'math'),
      patternProficiency: this.getTopicScore(topics, 'pattern')
    };
}

  getTraits(metrics) {
    const traits = [];
    const m = metrics;
    
    if (m.speed > 80 && m.accuracy > 70) traits.push({ name: 'Fast Solver', icon: '🚀', desc: 'Solves problems quickly' });
    if (m.accuracy > 85) traits.push({ name: 'Logical Thinker', icon: '🧠', desc: 'High accuracy approach' });
    if (m.graphProficiency > 80) traits.push({ name: 'Graph Enthusiast', icon: '🌳', desc: 'Loves graph problems' });
    if (m.optimization > 75) traits.push({ name: 'Optimization Expert', icon: '⚡', desc: 'Optimizes solutions' });
    if (m.speed > 70 && m.accuracy > 70 && m.variety > 60) traits.push({ name: 'Interview Ready', icon: '🎯', desc: 'Well-rounded performer' });
    if (m.mathProficiency > 80) traits.push({ name: 'Math Ninja', icon: '🧮', desc: 'Strong in math' });
    if (m.patternProficiency > 80) traits.push({ name: 'Pattern Master', icon: '🎨', desc: 'Recognizes patterns' });
    if (m.persistence > 80) traits.push({ name: 'Persistent Learner', icon: '💪', desc: 'Never gives up' });
    
    return traits;
  }
}
