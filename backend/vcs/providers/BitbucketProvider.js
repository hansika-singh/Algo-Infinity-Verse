import { VCSProvider } from '../VCSProvider.js';
import * as yaml from 'js-yaml';

export class BitbucketProvider extends VCSProvider {
  async getCIConfigFiles() {
    const match = this.repoUrl.match(/bitbucket\.org\/([^/]+)\/([^/]+)/);
    if (!match) throw new Error("Invalid Bitbucket URL");

    const workspace = match[1];
    const repo = match[2].replace(/\.git$/, '');

    const apiUrl = `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}/src/master/bitbucket-pipelines.yml`;
    const res = await fetch(apiUrl);

    if (!res.ok) {
      if (res.status === 404) {
        // Try main branch if master fails
        const fallbackRes = await fetch(`https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}/src/main/bitbucket-pipelines.yml`);
        if (!fallbackRes.ok) return [];
        const content = await fallbackRes.text();
        return [{ name: 'bitbucket-pipelines.yml', content }];
      }
      throw new Error(`Bitbucket API returned ${res.status}`);
    }

    const content = await res.text();
    return [{ name: 'bitbucket-pipelines.yml', content }];
  }

  normalizeCIConfig(rawContent) {
    const doc = yaml.load(rawContent);
    if (!doc || typeof doc !== 'object') return [];

    const commands = [];
    let hasJobs = false;

    // Bitbucket Pipelines structure: pipelines -> default, branches, tags, custom
    if (doc.pipelines) {
      const p = doc.pipelines;
      
      const extractSteps = (pipelineBlock) => {
        if (!pipelineBlock || !Array.isArray(pipelineBlock)) return;
        for (let item of pipelineBlock) {
          // Resolve js-yaml alias merge key '<<'
          if (item['<<']) {
            item = { ...item['<<'], ...item };
            delete item['<<'];
          }

          // Handle standard step
          if (item.step) {
            hasJobs = true;
            if (item.step.script && Array.isArray(item.step.script)) {
              for (const s of item.step.script) {
                if (typeof s === 'string') commands.push(s);
              }
            }
            if (item.step['after-script'] && Array.isArray(item.step['after-script'])) {
              for (const s of item.step['after-script']) {
                if (typeof s === 'string') commands.push(s);
              }
            }
          }
          // Handle parallel block containing steps
          if (item.parallel && Array.isArray(item.parallel)) {
            extractSteps(item.parallel);
          }
        }
      };

      if (p.default) extractSteps(p.default);
      
      if (p.branches) {
        for (const branch of Object.values(p.branches)) {
          extractSteps(branch);
        }
      }
      if (p.custom) {
        for (const custom of Object.values(p.custom)) {
          extractSteps(custom);
        }
      }
      if (p.tags) {
        for (const tag of Object.values(p.tags)) {
          extractSteps(tag);
        }
      }
    }
    
    if (commands.length === 0 && hasJobs) {
      commands.push("HAS_JOBS");
    }

    return commands;
  }
}
