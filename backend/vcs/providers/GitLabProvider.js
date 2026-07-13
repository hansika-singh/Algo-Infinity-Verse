import { VCSProvider } from '../VCSProvider.js';
import * as yaml from 'js-yaml';

export class GitLabProvider extends VCSProvider {
  async getCIConfigFiles() {
    const match = this.repoUrl.match(/gitlab\.com\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error("Invalid GitLab URL");

    const namespace = match[1];
    const project = match[2].replace(/\.git$/, '');
    
    // GitLab API requires URL-encoded namespace/project paths
    const encodedPath = encodeURIComponent(`${namespace}/${project}`);

    const apiUrl = `https://gitlab.com/api/v4/projects/${encodedPath}/repository/files/.gitlab-ci.yml/raw?ref=main`;
    
    const res = await fetch(apiUrl);

    if (!res.ok) {
      if (res.status === 404) {
        // Try master branch if main fails
        const fallbackRes = await fetch(`https://gitlab.com/api/v4/projects/${encodedPath}/repository/files/.gitlab-ci.yml/raw?ref=master`);
        if (!fallbackRes.ok) return [];
        const content = await fallbackRes.text();
        return [{ name: '.gitlab-ci.yml', content }];
      }
      throw new Error(`GitLab API returned ${res.status}`);
    }

    const content = await res.text();
    return [{ name: '.gitlab-ci.yml', content }];
  }

  normalizeCIConfig(rawContent) {
    const doc = yaml.load(rawContent);
    if (!doc || typeof doc !== 'object') return [];

    const commands = [];
    let hasJobs = false;

    // GitLab CI structure: root keys are either global config or job names
    const reservedKeys = ['image', 'services', 'stages', 'types', 'before_script', 'after_script', 'variables', 'cache', 'include', 'default', 'workflow'];
    
    if (doc.include) hasJobs = true;

    for (const key of Object.keys(doc)) {
      if (reservedKeys.includes(key)) {
        if (key === 'before_script' || key === 'after_script') {
          const scripts = doc[key] || [];
          if (Array.isArray(scripts)) {
            hasJobs = true;
            commands.push(...scripts);
          }
        }
        continue;
      }

      // Assume it's a job if it's not a reserved key and is an object
      const job = doc[key];
      if (typeof job === 'object' && job !== null && !Array.isArray(job)) {
        hasJobs = true;
        const scripts = job.script || [];
        if (Array.isArray(scripts)) commands.push(...scripts);
      }
    }
    
    if (commands.length === 0 && hasJobs) {
      commands.push("HAS_JOBS");
    }

    return commands;
  }
}
