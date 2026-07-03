import { analyzeWorkflow } from "./backend/repository-analyzer/cicdValidator.js";
import { VCSFactory } from "./backend/vcs/VCSFactory.js";

async function runTests() {
  const testUrls = [
    "https://github.com/expressjs/express", // Has workflows
    "https://github.com/octocat/Hello-World", // Might not have workflows
    "https://gitlab.com/gitlab-org/gitlab", // Testing GitLab adapter
    "https://bitbucket.org/atlassian/aws-sam-deploy", // Testing Bitbucket adapter
  ];

  for (const url of testUrls) {
    console.log(`\nTesting: ${url}`);
    try {
      const provider = VCSFactory.getProvider(url);
      const workflows = await provider.getNormalizedWorkflows();
      console.log(`Found ${workflows.length} workflows.`);
      
      let bestScore = 0;
      for (const wf of workflows) {
        console.log(`- Analyzing: ${wf.name}`);
        const result = analyzeWorkflow(wf.commands);
        console.log(`  Result:`, result);
        if (result.score > bestScore) bestScore = result.score;
      }
      console.log(`Overall Repository CI/CD Score: ${bestScore}`);
    } catch (err) {
      console.error("Test failed:", err.message);
    }
  }
}

runTests();
