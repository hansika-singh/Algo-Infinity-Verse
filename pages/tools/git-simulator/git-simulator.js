/**
 * git-simulator.js
 * An interactive Git Simulator with terminal and D3.js visualization.
 */

class GitEngine {
    constructor() {
        this.initialized = false;
        this.commits = new Map(); // hash -> commit object
        this.branches = new Map(); // branchName -> commit hash
        this.HEAD = null; // Can point to a branch name OR a commit hash (detached)
        
        // File system states
        this.workingDirectory = new Map(); // filename -> content
        this.stagingArea = new Map(); // filename -> content
        
        // Counter for visualization sorting/levels
        this.commitCounter = 0;
    }

    init() {
        if (this.initialized) {
            throw new Error("Reinitialized existing Git repository");
        }
        this.initialized = true;
        this.branches.set("main", null);
        this.HEAD = "main";
        return "Initialized empty Git repository";
    }

    assertInitialized() {
        if (!this.initialized) {
            throw new Error("fatal: not a git repository (or any of the parent directories): .git");
        }
    }

    _generateHash() {
        return Math.random().toString(16).substring(2, 9);
    }

    _getCurrentCommitHash() {
        if (this.branches.has(this.HEAD)) {
            return this.branches.get(this.HEAD);
        }
        return this.HEAD;
    }

    touch(filename, content = "content") {
        this.assertInitialized();
        this.workingDirectory.set(filename, content);
        return `Created file ${filename}`;
    }

    rm(filename) {
        this.assertInitialized();
        if (this.workingDirectory.has(filename)) {
            this.workingDirectory.delete(filename);
            return `Removed file ${filename}`;
        }
        throw new Error(`rm: cannot remove '${filename}': No such file or directory`);
    }

    add(filename) {
        this.assertInitialized();
        if (filename === ".") {
            for (let [file, content] of this.workingDirectory.entries()) {
                this.stagingArea.set(file, content);
            }
            return "";
        }

        if (!this.workingDirectory.has(filename)) {
            throw new Error(`fatal: pathspec '${filename}' did not match any files`);
        }
        this.stagingArea.set(filename, this.workingDirectory.get(filename));
        return "";
    }

    commit(message) {
        this.assertInitialized();
        if (this.stagingArea.size === 0) {
            throw new Error("nothing to commit, working tree clean");
        }

        const hash = this._generateHash();
        const parentHash = this._getCurrentCommitHash();
        
        const tree = new Map(this.stagingArea);
        if (parentHash) {
            const parentTree = this.commits.get(parentHash).tree;
            for (let [file, content] of parentTree.entries()) {
                if (!tree.has(file)) {
                    tree.set(file, content);
                }
            }
        }

        const newCommit = {
            hash,
            message,
            parents: parentHash ? [parentHash] : [],
            tree,
            order: this.commitCounter++
        };

        this.commits.set(hash, newCommit);

        // Update HEAD or branch
        if (this.branches.has(this.HEAD)) {
            this.branches.set(this.HEAD, hash);
        } else {
            this.HEAD = hash; // Detached HEAD
        }

        return `[${this.HEAD === hash ? 'detached HEAD' : this.HEAD} ${hash}] ${message}`;
    }

    branch(branchName) {
        this.assertInitialized();
        if (!branchName) {
            // List branches
            let output = [];
            for (let b of this.branches.keys()) {
                if (b === this.HEAD) {
                    output.push(`* <span style="color:#4ade80">${b}</span>`);
                } else {
                    output.push(`  ${b}`);
                }
            }
            if (!this.branches.has(this.HEAD)) {
                output.unshift(`* <span style="color:#4ade80">(HEAD detached at ${this.HEAD})</span>`);
            }
            return output.join("<br>");
        }

        if (this.branches.has(branchName)) {
            throw new Error(`fatal: A branch named '${branchName}' already exists.`);
        }
        
        const currentHash = this._getCurrentCommitHash();
        if (!currentHash) {
            throw new Error(`fatal: Not a valid object name: 'HEAD'.`);
        }

        this.branches.set(branchName, currentHash);
        return "";
    }

    checkout(target) {
        this.assertInitialized();
        
        // Try branch
        if (this.branches.has(target)) {
            this.HEAD = target;
            this._restoreWorkingTree(this.branches.get(target));
            return `Switched to branch '${target}'`;
        }
        
        // Try commit hash (detached)
        if (this.commits.has(target)) {
            this.HEAD = target;
            this._restoreWorkingTree(target);
            return `Note: switching to '${target}'.\n\nYou are in 'detached HEAD' state.`;
        }

        throw new Error(`error: pathspec '${target}' did not match any file(s) known to git`);
    }

    _restoreWorkingTree(hash) {
        this.workingDirectory.clear();
        this.stagingArea.clear();
        if (hash && this.commits.has(hash)) {
            const tree = this.commits.get(hash).tree;
            for (let [file, content] of tree.entries()) {
                this.workingDirectory.set(file, content);
                this.stagingArea.set(file, content);
            }
        }
    }

    merge(branchName) {
        this.assertInitialized();
        if (!this.branches.has(branchName)) {
            throw new Error(`merge: ${branchName} - not something we can merge`);
        }
        
        const targetHash = this.branches.get(branchName);
        const currentHash = this._getCurrentCommitHash();

        if (!currentHash) throw new Error("fatal: cannot merge into unborn branch");

        if (targetHash === currentHash) {
            return "Already up to date.";
        }

        // Simplistic merge: just create a merge commit
        const hash = this._generateHash();
        
        // Merge trees naively (target overwrites current)
        const currentTree = this.commits.get(currentHash).tree;
        const targetTree = this.commits.get(targetHash).tree;
        const newTree = new Map(currentTree);
        for (let [file, content] of targetTree.entries()) {
            newTree.set(file, content);
        }

        const newCommit = {
            hash,
            message: `Merge branch '${branchName}'`,
            parents: [currentHash, targetHash],
            tree: newTree,
            order: this.commitCounter++
        };

        this.commits.set(hash, newCommit);
        if (this.branches.has(this.HEAD)) {
            this.branches.set(this.HEAD, hash);
        } else {
            this.HEAD = hash;
        }

        this._restoreWorkingTree(hash);
        return `Merge made by the 'recursive' strategy.`;
    }

    rebase(branchName) {
        this.assertInitialized();
        if (!this.branches.has(branchName)) {
            throw new Error(`fatal: invalid upstream '${branchName}'`);
        }

        const targetHash = this.branches.get(branchName);
        const currentHash = this._getCurrentCommitHash();

        if (targetHash === currentHash) {
            return "Current branch is up to date.";
        }

        // For simplicity, we won't rewrite history completely, but we will create new nodes
        // simulating the rebase of current HEAD onto target branch.
        const currentCommit = this.commits.get(currentHash);
        
        const newHash = this._generateHash();
        const newCommit = {
            hash: newHash,
            message: currentCommit.message,
            parents: [targetHash],
            tree: currentCommit.tree,
            order: this.commitCounter++
        };

        this.commits.set(newHash, newCommit);
        
        if (this.branches.has(this.HEAD)) {
            this.branches.set(this.HEAD, newHash);
        } else {
            this.HEAD = newHash;
        }

        this._restoreWorkingTree(newHash);
        return `Successfully rebased and updated ${this.HEAD}.`;
    }

    resetHard(targetHash) {
        this.assertInitialized();
        if (!this.commits.has(targetHash)) {
            throw new Error(`fatal: Could not parse object '${targetHash}'.`);
        }

        if (this.branches.has(this.HEAD)) {
            this.branches.set(this.HEAD, targetHash);
        } else {
            this.HEAD = targetHash;
        }

        this._restoreWorkingTree(targetHash);
        return `HEAD is now at ${targetHash}`;
    }

    log() {
        this.assertInitialized();
        let current = this._getCurrentCommitHash();
        if (!current) {
            throw new Error("fatal: your current branch 'main' does not have any commits yet");
        }

        let output = [];
        const visited = new Set();

        const traverse = (hash) => {
            if (visited.has(hash)) return;
            visited.add(hash);
            const commit = this.commits.get(hash);
            
            // Build refs string
            let refs = [];
            if (this.HEAD === hash) refs.push("HEAD");
            for (let [b, h] of this.branches.entries()) {
                if (h === hash) {
                    if (this.HEAD === b) refs.push(`HEAD -> ${b}`);
                    else refs.push(b);
                }
            }
            let refsStr = refs.length > 0 ? ` <span style="color:#fbbf24">(${refs.join(", ")})</span>` : "";

            output.push(`<span style="color:#fbbf24">commit ${commit.hash}</span>${refsStr}`);
            output.push(`    ${commit.message}`);
            output.push("");

            for (let parent of commit.parents) {
                traverse(parent);
            }
        };

        traverse(current);
        return output.join("<br>");
    }

    getStatus() {
        return {
            initialized: this.initialized,
            commits: Array.from(this.commits.values()),
            branches: Array.from(this.branches.entries()).map(([k,v]) => ({name:k, target:v})),
            head: this.HEAD,
            workingDir: Array.from(this.workingDirectory.keys()),
            staging: Array.from(this.stagingArea.keys())
        };
    }
}

// ----------------------------------------------------
// Terminal & App Logic
// ----------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    const git = new GitEngine();
    
    const terminalInput = document.getElementById("terminalInput");
    const terminalBody = document.getElementById("terminalBody");
    const promptWrapper = document.getElementById("promptWrapper");

    function printTerminal(text, className = "output-text") {
        if (!text) return;
        const line = document.createElement("div");
        line.className = `terminal-line ${className}`;
        line.innerHTML = text.replace(/\n/g, "<br>");
        terminalBody.insertBefore(line, promptWrapper);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    function processCommand(cmdStr) {
        printTerminal(`$ ${cmdStr}`);
        const args = cmdStr.trim().split(/\s+/);
        const program = args[0];

        if (!program) return;

        if (program === "help") {
            printTerminal("Available commands:");
            printTerminal("  git init             - Initialize repository");
            printTerminal("  git add .            - Add files to staging");
            printTerminal("  git commit -m 'msg'  - Commit changes");
            printTerminal("  git branch <name>    - Create a branch");
            printTerminal("  git checkout <name>  - Switch branches/commits");
            printTerminal("  git merge <name>     - Merge branch");
            printTerminal("  git rebase <name>    - Rebase branch");
            printTerminal("  git reset --hard <h> - Reset HEAD to hash");
            printTerminal("  git log              - View history");
            printTerminal("  touch <file>         - Create a virtual file");
            printTerminal("  rm <file>            - Delete a virtual file");
            printTerminal("  clear                - Clear terminal");
            return;
        }

        if (program === "clear") {
            // Remove all lines except welcome and prompt
            const lines = terminalBody.querySelectorAll(".terminal-line:not(.welcome-text)");
            lines.forEach(l => l.remove());
            return;
        }

        if (program === "touch") {
            try {
                if(!args[1]) throw new Error("touch: missing file operand");
                printTerminal(git.touch(args[1]), "success-text");
                updateUI();
            } catch(e) {
                printTerminal(e.message, "error-text");
            }
            return;
        }

        if (program === "rm") {
            try {
                if(!args[1]) throw new Error("rm: missing operand");
                printTerminal(git.rm(args[1]));
                updateUI();
            } catch(e) {
                printTerminal(e.message, "error-text");
            }
            return;
        }

        if (program === "git") {
            const subCmd = args[1];
            try {
                let output = "";
                switch(subCmd) {
                    case "init":
                        output = git.init();
                        break;
                    case "add":
                        output = git.add(args[2]);
                        break;
                    case "commit":
                        let msg = args.slice(2).join(" ");
                        if(msg.startsWith("-m")) {
                            msg = msg.replace("-m", "").trim();
                            if(msg.startsWith("'") || msg.startsWith('"')) msg = msg.slice(1, -1);
                        }
                        output = git.commit(msg || "Empty message");
                        break;
                    case "branch":
                        output = git.branch(args[2]);
                        break;
                    case "checkout":
                        output = git.checkout(args[2]);
                        break;
                    case "merge":
                        output = git.merge(args[2]);
                        break;
                    case "rebase":
                        output = git.rebase(args[2]);
                        break;
                    case "reset":
                        if (args[2] === "--hard") output = git.resetHard(args[3]);
                        else throw new Error("Only git reset --hard is supported in this simulation.");
                        break;
                    case "log":
                        output = git.log();
                        break;
                    default:
                        throw new Error(`git: '${subCmd}' is not a git command. See 'git --help'.`);
                }
                printTerminal(output);
                updateUI();
            } catch (e) {
                printTerminal(e.message, "error-text");
            }
        } else {
            printTerminal(`bash: ${program}: command not found`, "error-text");
        }
    }

    terminalInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            const val = terminalInput.value;
            terminalInput.value = "";
            processCommand(val);
        }
    });

    // Keep focus
    document.querySelector(".terminal-panel").addEventListener("click", () => {
        terminalInput.focus();
    });

    document.getElementById("btnHelp").addEventListener("click", () => {
        processCommand("help");
    });

    document.getElementById("btnReset").addEventListener("click", () => {
        if(confirm("Reset entire simulation?")) {
            location.reload();
        }
    });

    // ----------------------------------------------------
    // D3 Visualization
    // ----------------------------------------------------
    
    const svg = d3.select("#d3GraphSvg");
    const container = document.getElementById("graphContainer");
    
    // SVG groups
    const gLinks = svg.append("g").attr("class", "links");
    const gNodes = svg.append("g").attr("class", "nodes");
    const gLabels = svg.append("g").attr("class", "labels");

    const NODE_RADIUS = 16;
    const X_SPACING = 80;
    const Y_SPACING = 60;

    function updateUI() {
        const state = git.getStatus();
        
        // Status Badge
        const detachedBadge = document.getElementById("detachedBadge");
        const headLabel = document.getElementById("headLabel");
        const emptyState = document.getElementById("emptyState");

        if (!state.initialized) {
            headLabel.textContent = "No Repository";
            emptyState.classList.remove("hidden");
            detachedBadge.classList.add("hidden");
            return;
        }

        emptyState.classList.add("hidden");

        const isDetached = !state.branches.some(b => b.name === state.head);
        headLabel.textContent = state.head;
        
        if (isDetached) {
            detachedBadge.classList.remove("hidden");
        } else {
            detachedBadge.classList.add("hidden");
        }

        // Update Context Pane (Files)
        const wdList = document.getElementById("workingDirList");
        wdList.innerHTML = state.workingDir.length ? "" : '<li class="empty-text">No files</li>';
        state.workingDir.forEach(f => {
            const li = document.createElement("li");
            li.textContent = f;
            li.className = state.staging.includes(f) ? "added" : "untracked";
            wdList.appendChild(li);
        });

        const stList = document.getElementById("stagingAreaList");
        stList.innerHTML = state.staging.length ? "" : '<li class="empty-text">Empty</li>';
        state.staging.forEach(f => {
            const li = document.createElement("li");
            li.textContent = f;
            li.className = "added";
            stList.appendChild(li);
        });

        drawGraph(state);
    }

    function drawGraph(state) {
        const commits = state.commits;
        if (commits.length === 0) {
            gNodes.selectAll("*").remove();
            gLinks.selectAll("*").remove();
            gLabels.selectAll("*").remove();
            return;
        }

        // Layout algorithm
        // Sort commits by order
        commits.sort((a,b) => a.order - b.order);
        
        // Map to hold calculated positions
        const layout = new Map(); // hash -> {x, y, track}
        
        let trackCounter = 0;
        let maxTrack = 0;

        commits.forEach((c, idx) => {
            let track = 0;
            // Determine track based on first parent
            if (c.parents.length > 0) {
                const parentHash = c.parents[0];
                if (layout.has(parentHash)) {
                    // Check if parent's track is already claimed by another child
                    // A simple heuristic: if parent is right below, keep track. 
                    // To keep it simple, just reuse parent track if possible
                    track = layout.get(parentHash).track;
                }
            } else {
                track = trackCounter++;
            }

            // Simple collision check - push to new track if needed
            while (Array.from(layout.values()).some(n => n.y === idx && n.track === track)) {
                track++;
            }
            
            if (track > maxTrack) maxTrack = track;

            layout.set(c.hash, {
                x: 40 + track * X_SPACING,
                y: 40 + idx * Y_SPACING,
                track: track,
                commit: c
            });
        });

        // Resize SVG
        svg.attr("height", Math.max(400, commits.length * Y_SPACING + 100));
        svg.attr("width", Math.max(container.clientWidth, maxTrack * X_SPACING + 300)); // padding for labels

        // Create Links
        const linkData = [];
        commits.forEach(c => {
            const target = layout.get(c.hash);
            c.parents.forEach(pHash => {
                const source = layout.get(pHash);
                if (source) {
                    linkData.push({ source, target });
                }
            });
        });

        const links = gLinks.selectAll(".commit-link")
            .data(linkData, d => d.source.commit.hash + "-" + d.target.commit.hash);

        links.enter().append("path")
            .attr("class", "commit-link")
            .attr("d", d => {
                const sx = d.source.x, sy = d.source.y;
                const tx = d.target.x, ty = d.target.y;
                if (sx === tx) {
                    return `M${sx},${sy} L${tx},${ty}`;
                } else {
                    return `M${sx},${sy} C${sx},${(sy+ty)/2} ${tx},${(sy+ty)/2} ${tx},${ty}`;
                }
            });
        
        links.transition().duration(300)
            .attr("d", d => {
                const sx = d.source.x, sy = d.source.y;
                const tx = d.target.x, ty = d.target.y;
                if (sx === tx) {
                    return `M${sx},${sy} L${tx},${ty}`;
                } else {
                    return `M${sx},${sy} C${sx},${(sy+ty)/2} ${tx},${(sy+ty)/2} ${tx},${ty}`;
                }
            });

        links.exit().remove();

        // Create Nodes
        const nodes = gNodes.selectAll(".commit-node")
            .data(Array.from(layout.values()), d => d.commit.hash);

        nodes.enter().append("circle")
            .attr("class", d => "commit-node" + (state.head === d.commit.hash || state.branches.find(b=>b.target===d.commit.hash && state.head===b.name) ? " head" : ""))
            .attr("r", 0)
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .on("mouseover", showTooltip)
            .on("mouseout", hideTooltip)
            .transition().duration(300)
            .attr("r", NODE_RADIUS);

        nodes.transition().duration(300)
            .attr("class", d => "commit-node" + ((state.head === d.commit.hash || state.branches.find(b=>b.target===d.commit.hash && state.head===b.name)) ? " head" : ""))
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        nodes.exit().transition().duration(200).attr("r", 0).remove();

        // Create Labels (Branches & HEAD)
        const labelData = [];
        state.branches.forEach(b => {
            if (b.target) {
                labelData.push({
                    text: b.name,
                    hash: b.target,
                    isHead: state.head === b.name
                });
            }
        });
        
        // If HEAD is detached
        if (!state.branches.some(b => b.name === state.head) && state.head && state.head !== "main") {
            labelData.push({
                text: "HEAD",
                hash: state.head,
                isHead: true
            });
        }

        const labels = gLabels.selectAll(".branch-group")
            .data(labelData, d => d.text);

        const labelsEnter = labels.enter().append("g")
            .attr("class", "branch-group")
            .attr("transform", d => {
                const n = layout.get(d.hash);
                return n ? `translate(${n.x + 25}, ${n.y})` : "";
            });

        labelsEnter.append("rect")
            .attr("class", "branch-label-rect")
            .attr("y", -10)
            .attr("height", 20);

        labelsEnter.append("text")
            .attr("class", d => "branch-label-text" + (d.isHead ? " head" : ""))
            .attr("x", 8)
            .attr("y", 4)
            .text(d => d.text)
            .each(function() {
                const bbox = this.getBBox();
                d3.select(this.parentNode).select("rect").attr("width", bbox.width + 16);
            });

        labels.transition().duration(300)
            .attr("transform", (d, i) => {
                const n = layout.get(d.hash);
                // Stack labels if multiple point to same hash
                const offset = labelData.slice(0, i).filter(l => l.hash === d.hash).length;
                return n ? `translate(${n.x + 25 + (offset * 80)}, ${n.y})` : "";
            });
            
        labels.select(".branch-label-text")
            .attr("class", d => "branch-label-text" + (d.isHead ? " head" : ""));

        labels.exit().remove();
        
        // Auto scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    const tooltip = document.getElementById("commitTooltip");
    const ttHash = document.getElementById("ttHash");
    const ttMsg = document.getElementById("ttMsg");
    const ttParents = document.getElementById("ttParents");

    function showTooltip(event, d) {
        ttHash.textContent = d.commit.hash;
        ttMsg.textContent = d.commit.message;
        ttParents.textContent = d.commit.parents.length ? `Parents: ${d.commit.parents.join(', ')}` : "Root commit";

        tooltip.classList.remove("hidden");
        
        const rect = container.getBoundingClientRect();
        const tooltipX = event.clientX - rect.left + 15;
        const tooltipY = event.clientY - rect.top + 15;
        
        tooltip.style.left = `${tooltipX}px`;
        tooltip.style.top = `${tooltipY}px`;
    }

    function hideTooltip() {
        tooltip.classList.add("hidden");
    }
});
