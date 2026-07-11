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
    void 0;
    try {
      const provider = VCSFactory.getProvider(url);
      const workflows = await provider.getNormalizedWorkflows();
      void 0;
      
      let bestScore = 0;
      for (const wf of workflows) {
        void 0;
        const result = analyzeWorkflow(wf.commands);
        void 0;
        if (result.score > bestScore) bestScore = result.score;
      }
      void 0;
    } catch (err) {
      console.error("Test failed:", err.message);
    }
  }
}

runTests();
