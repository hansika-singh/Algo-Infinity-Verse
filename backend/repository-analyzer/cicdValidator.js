/**
 * Validates a normalized array of CI/CD commands to detect practices.
 * Returns an object with metrics on dependencies, tests, and a calculated score.
 *
 * @param {Array<string>} commands - Flat array of execution scripts from VCS.
 */
export function analyzeWorkflow(commands) {
  try {
    if (!commands || !Array.isArray(commands)) {
      return { score: 0, hasJobs: false, hasDependencies: false, hasTests: false };
    }

    if (commands.length === 0) {
      return { score: 0, hasJobs: false, hasDependencies: false, hasTests: false };
    }

    let hasJobs = false;
    let hasDependencies = false;
    let hasTests = false;

    // Common patterns universally applicable to raw shell scripts
    const depPatterns = /npm (install|ci)|pip install|yarn(\s+install)?|go mod download|actions\/setup-/i;
    const testPatterns = /npm (run )?test|jest|pytest|vitest|go test|mvn test|cypress-io/i;

    for (const cmd of commands) {
      if (cmd === "HAS_JOBS") {
        hasJobs = true;
        continue;
      }
      
      hasJobs = true;
      if (depPatterns.test(cmd)) hasDependencies = true;
      if (testPatterns.test(cmd)) hasTests = true;
    }

    let score = 0;
    if (hasJobs) score = 20; 
    if (hasDependencies && !hasTests) score = 50;
    if (!hasDependencies && hasTests) score = 75; // Unlikely but possible
    if (hasDependencies && hasTests) score = 100;

    return {
      score,
      hasJobs,
      hasDependencies,
      hasTests
    };

  } catch (err) {
    console.error("Analyzer error:", err.message);
    return { score: 0, hasJobs: false, hasDependencies: false, hasTests: false, error: err.message };
  }
}

