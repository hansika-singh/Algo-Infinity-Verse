import { GitHubProvider } from './providers/GitHubProvider.js';
import { GitLabProvider } from './providers/GitLabProvider.js';
import { BitbucketProvider } from './providers/BitbucketProvider.js';

/**
 * Factory class to instantiate the appropriate VCSProvider
 * based on the repository URL.
 */
export class VCSFactory {
  static getProvider(repoUrl) {
    if (!repoUrl || typeof repoUrl !== 'string') {
      throw new Error("Invalid repository URL provided.");
    }

    if (repoUrl.includes("github.com")) {
      return new GitHubProvider(repoUrl);
    } else if (repoUrl.includes("gitlab.com")) {
      return new GitLabProvider(repoUrl);
    } else if (repoUrl.includes("bitbucket.org")) {
      return new BitbucketProvider(repoUrl);
    }

    throw new Error(`Unsupported VCS provider for URL: ${repoUrl}`);
  }
}
