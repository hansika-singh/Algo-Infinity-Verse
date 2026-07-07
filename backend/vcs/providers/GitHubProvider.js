import { VCSProvider } from '../VCSProvider.js';
import { processInBatches } from '../../utils/concurrency.js';
import * as yaml from 'js-yaml';

export class GitHubProvider extends VCSProvider {
  async getCIConfigFiles() {
    const match = this.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error("Invalid GitHub URL");

    const owner = match[1];
    const repo = match[2].replace(/\.git$/, '');

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/.github/workflows`;
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Algo-Infinity-Verse-Analyzer',
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!res.ok) {
      if (res.status === 404) return []; 
      throw new Error(`GitHub API returned ${res.status}`);
    }

    const files = await res.json();
    if (!Array.isArray(files)) return [];

    const yamlFiles = files.filter(f => f.name.endsWith('.yml') || f.name.endsWith('.yaml'));
    
    const workflows = await processInBatches(yamlFiles, async (file) => {
      const fileRes = await fetch(file.download_url);
      if (fileRes.ok) {
        const content = await fileRes.text();
        return { name: file.name, content };
      }
      return null;
    }, 3);

    return workflows.filter(w => w !== null);
  }

  normalizeCIConfig(rawContent) {
    const doc = yaml.load(rawContent);
    if (!doc || typeof doc !== 'object') return [];

    const commands = [];
    const jobs = doc.jobs || {};
    
    for (const jobKey of Object.keys(jobs)) {
      const job = jobs[jobKey];
      const steps = job.steps || [];
      for (const step of steps) {
        if (step.run) commands.push(step.run);
        if (step.uses) commands.push(`uses: ${step.uses}`); // Record action usages as mock commands
      }
    }
    
    // Also consider it a valid placeholder if it has jobs but no run steps
    if (commands.length === 0 && Object.keys(jobs).length > 0) {
      commands.push("HAS_JOBS");
    }

    return commands;
  }
}
