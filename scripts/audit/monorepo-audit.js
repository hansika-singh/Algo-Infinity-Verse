import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Common directories to ignore during traversal to improve performance
const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage']);

/**
 * Detects the monorepo framework and returns an array of glob patterns or specific directories
 * where sub-packages are located.
 * @param {string} rootDir 
 * @returns {{ type: string, patterns: string[] }}
 */
export function detectWorkspaceConfigs(rootDir) {
    let type = 'single-project';
    let patterns = [];

    // Check for Turbo
    if (fs.existsSync(path.join(rootDir, 'turbo.json'))) {
        type = 'monorepo-turborepo';
    }

    // Check for Nx
    if (fs.existsSync(path.join(rootDir, 'nx.json'))) {
        type = 'monorepo-nx';
        const nxJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'nx.json'), 'utf8'));
        if (nxJson.workspaceLayout) {
            patterns.push(`${nxJson.workspaceLayout.appsDir}/*`, `${nxJson.workspaceLayout.libsDir}/*`);
        }
    }

    // Check for Lerna
    if (fs.existsSync(path.join(rootDir, 'lerna.json'))) {
        type = type === 'single-project' ? 'monorepo-lerna' : type;
        const lernaJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'lerna.json'), 'utf8'));
        if (lernaJson.packages) {
            patterns.push(...lernaJson.packages);
        }
    }

    // Check for pnpm workspace
    if (fs.existsSync(path.join(rootDir, 'pnpm-workspace.yaml'))) {
        type = type === 'single-project' ? 'monorepo-pnpm' : type;
        const pnpmYaml = fs.readFileSync(path.join(rootDir, 'pnpm-workspace.yaml'), 'utf8');
        const matches = pnpmYaml.match(/-\s+'([^']+)'/g);
        if (matches) {
            patterns.push(...matches.map(m => m.replace(/-\s+'?/, '').replace(/'$/, '')));
        }
    }

    // Check npm/yarn workspaces in package.json
    if (fs.existsSync(path.join(rootDir, 'package.json'))) {
        const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
        if (pkg.workspaces) {
            type = type === 'single-project' ? 'monorepo-npm' : type;
            patterns.push(...(Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces.packages || []));
        }
    }

    return { type, patterns: [...new Set(patterns)] };
}

/**
 * Basic glob matching for paths like `packages/*`
 */
function expandGlob(rootDir, pattern) {
    const cleanPattern = pattern.replace('/*', '');
    const searchDir = path.join(rootDir, cleanPattern);
    
    if (!fs.existsSync(searchDir)) return [];
    
    return fs.readdirSync(searchDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory() && !IGNORE_DIRS.has(dirent.name))
        .map(dirent => path.join(cleanPattern, dirent.name));
}

/**
 * Perform a bounded recursive search looking for package.json
 */
function boundedRecursiveSearch(dir, rootDir, depth, maxDepth = 3) {
    if (depth > maxDepth) return [];
    
    let results = [];
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
        return [];
    }

    for (const entry of entries) {
        if (entry.isDirectory() && !IGNORE_DIRS.has(entry.name)) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(rootDir, fullPath);
            
            // If it has a package.json, we consider it a subproject
            if (fs.existsSync(path.join(fullPath, 'package.json'))) {
                results.push(relativePath);
            } else {
                results.push(...boundedRecursiveSearch(fullPath, rootDir, depth + 1, maxDepth));
            }
        }
    }
    return results;
}

/**
 * Scans a specific project directory for configurations and files
 */
export function auditProject(projectPath) {
    const findings = {
        hasPackageJson: false,
        hasTsConfig: false,
        hasEslint: false,
        hasPrettier: false,
        hasTests: false,
        dependencies: []
    };

    if (fs.existsSync(path.join(projectPath, 'package.json'))) {
        findings.hasPackageJson = true;
        const pkg = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
        findings.dependencies = Object.keys(pkg.dependencies || {}).concat(Object.keys(pkg.devDependencies || {}));
    }

    findings.hasTsConfig = fs.existsSync(path.join(projectPath, 'tsconfig.json'));
    findings.hasEslint = fs.existsSync(path.join(projectPath, '.eslintrc')) || fs.existsSync(path.join(projectPath, '.eslintrc.json')) || fs.existsSync(path.join(projectPath, 'eslint.config.js'));
    findings.hasPrettier = fs.existsSync(path.join(projectPath, '.prettierrc')) || fs.existsSync(path.join(projectPath, '.prettierrc.json'));
    
    // Check for common test configurations
    findings.hasTests = fs.existsSync(path.join(projectPath, 'jest.config.js')) || fs.existsSync(path.join(projectPath, 'vitest.config.js'));

    return findings;
}

/**
 * Main function to run the audit
 */
export function runAudit(rootDir) {
    console.log(`Starting audit for: ${rootDir}`);
    
    const { type, patterns } = detectWorkspaceConfigs(rootDir);
    console.log(`Detected project type: ${type}`);
    
    let subprojects = [];

    if (patterns.length > 0) {
        console.log(`Found workspace patterns: ${patterns.join(', ')}`);
        for (const pattern of patterns) {
            subprojects.push(...expandGlob(rootDir, pattern));
        }
    } else {
        console.log(`No explicit workspaces found. Falling back to depth-aware recursive search...`);
        subprojects = boundedRecursiveSearch(rootDir, rootDir, 0);
    }

    // Deduplicate projects
    subprojects = [...new Set(subprojects)];
    console.log(`Discovered ${subprojects.length} subprojects.`);

    const report = {
        projectType: type,
        repositoryRoot: auditProject(rootDir),
        packages: []
    };

    for (const sub of subprojects) {
        const fullPath = path.join(rootDir, sub);
        report.packages.push({
            name: sub,
            path: sub,
            findings: auditProject(fullPath)
        });
    }

    return report;
}

// If run from command line
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
    const rootDir = process.argv[2] || process.cwd();
    const report = runAudit(rootDir);
    fs.writeFileSync(path.join(rootDir, 'audit-report.json'), JSON.stringify(report, null, 2));
    console.log('Audit complete. Results saved to audit-report.json');
}
