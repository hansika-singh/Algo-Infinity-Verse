/**
 * Abstract Base Class for Version Control System (VCS) Providers.
 * Ensures a uniform interface for fetching and normalizing CI/CD workflows
 * across different platforms (GitHub, GitLab, Bitbucket, etc.).
 */
export class VCSProvider {
  constructor(repoUrl) {
    this.repoUrl = repoUrl;
  }

  /**
   * Abstract method to fetch CI/CD configuration files from the VCS.
   * @returns {Promise<Array<{name: string, content: string}>>}
   */
  async getCIConfigFiles() {
    throw new Error("Method 'getCIConfigFiles()' must be implemented by subclasses.");
  }

  /**
   * Abstract method to normalize platform-specific YAML into a unified array of commands.
   * @param {string} rawContent - The raw YAML string from the CI file.
   * @returns {Array<string>} - A flat array of executed shell commands.
   */
  normalizeCIConfig(_rawContent) {
    throw new Error("Method 'normalizeCIConfig()' must be implemented by subclasses.");
  }

  /**
   * Fetches and normalizes all workflows for this repository.
   * @returns {Promise<Array<{name: string, commands: Array<string>}>>}
   */
  async getNormalizedWorkflows() {
    const files = await this.getCIConfigFiles();
    if (!files || files.length === 0) return [];

    return files.map(file => {
      try {
        const commands = this.normalizeCIConfig(file.content);
        return { name: file.name, commands };
      } catch (err) {
        void 0;
        return { name: file.name, commands: [] };
      }
    });
  }
}
