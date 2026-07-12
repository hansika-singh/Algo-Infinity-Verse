class TestGenerator {
    constructor(seed = null) {
        this.seed = seed;
        // Basic seeded random (linear congruential generator) if seed provided
        this.m = 0x80000000;
        this.a = 1103515245;
        this.c = 12345;
        this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
    }

    random() {
        if (this.seed !== null) {
            this.state = (this.a * this.state + this.c) % this.m;
            return this.state / (this.m - 1);
        }
        return Math.random();
    }

    getRandomInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    // --- ARRAYS ---
    generateArray(size, options = {}) {
        const { min = -1000, max = 1000, unique = false, sorted = false, reverse = false } = options;
        let arr = [];
        if (size === 0) return [];
        
        if (unique) {
            if (max - min + 1 < size) {
                throw new Error("Range too small for unique elements of given size.");
            }
            const set = new Set();
            while (set.size < size) {
                set.add(this.getRandomInt(min, max));
            }
            arr = Array.from(set);
        } else {
            for (let i = 0; i < size; i++) {
                arr.push(this.getRandomInt(min, max));
            }
        }

        if (sorted) arr.sort((a, b) => a - b);
        if (reverse) arr.sort((a, b) => b - a);
        return arr;
    }

    // --- STRINGS ---
    generateString(length, options = {}) {
        const { charSet = 'abcdefghijklmnopqrstuvwxyz', unique = false } = options;
        if (length === 0) return "";
        if (unique && charSet.length < length) {
            throw new Error("Charset too small for unique characters of given length.");
        }
        let str = "";
        let availableChars = charSet.split('');
        for (let i = 0; i < length; i++) {
            const idx = this.getRandomInt(0, availableChars.length - 1);
            str += availableChars[idx];
            if (unique) availableChars.splice(idx, 1);
        }
        return str;
    }

    // --- MATRICES ---
    generateMatrix(rows, cols, options = {}) {
        if (rows === 0 || cols === 0) return [];
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            matrix.push(this.generateArray(cols, options));
        }
        return matrix;
    }

    // --- LINKED LIST (returns array representation, can be used to construct LL) ---
    generateLinkedList(size, options = {}) {
        return this.generateArray(size, options);
    }

    // --- BINARY TREES (Array representation for level order) ---
    generateBinaryTree(size, options = {}) {
        const { min = -1000, max = 1000, skewed = false, skewDirection = 'right' } = options;
        if (size === 0) return [];
        const tree = new Array(size).fill(null);
        
        if (skewed) {
            tree[0] = this.getRandomInt(min, max);
            let currentIndex = 0;
            for (let i = 1; i < size; i++) {
                currentIndex = skewDirection === 'right' ? 2 * currentIndex + 2 : 2 * currentIndex + 1;
                if (currentIndex >= tree.length) {
                    const oldLength = tree.length;
                    tree.length = currentIndex + 1;
                    tree.fill(null, oldLength);
                }
                tree[currentIndex] = this.getRandomInt(min, max);
            }
            return tree;
        } else {
            for (let i = 0; i < size; i++) {
                // ~20% chance of null node if not the root, unless we want strict size
                if (i > 0 && this.random() < 0.2) {
                    tree[i] = null;
                } else {
                    tree[i] = this.getRandomInt(min, max);
                }
            }
            return tree;
        }
    }

    // --- BINARY SEARCH TREE (Array representation) ---
    generateBST(size, options = {}) {
        const arr = this.generateArray(size, { ...options, unique: true, sorted: true });
        // Build balanced BST and return level order array
        const tree = [];
        const build = (left, right, index) => {
            if (left > right) return;
            const mid = Math.floor((left + right) / 2);
            tree[index] = arr[mid];
            build(left, mid - 1, 2 * index + 1);
            build(mid + 1, right, 2 * index + 2);
        };
        build(0, arr.length - 1, 0);
        
        // Fill nulls for sparse array
        const maxIndex = Math.max(...Object.keys(tree).map(Number));
        const result = new Array(maxIndex + 1).fill(null);
        for(let key in tree) {
            result[key] = tree[key];
        }
        return result;
    }

    // --- GRAPHS (Adjacency List) ---
    generateGraph(nodes, edgesCount, options = {}) {
        const { directed = false, weighted = false, minWeight = 1, maxWeight = 10 } = options;
        if (nodes === 0) return {};
        
        const adjList = {};
        for (let i = 0; i < nodes; i++) {
            adjList[i] = [];
        }

        let edgeAttempts = 0;
        let edgesAdded = 0;
        const maxEdges = directed ? nodes * (nodes - 1) : (nodes * (nodes - 1)) / 2;
        const targetEdges = Math.min(edgesCount, maxEdges);

        const edgeSet = new Set();

        while (edgesAdded < targetEdges && edgeAttempts < targetEdges * 10) {
            const u = this.getRandomInt(0, nodes - 1);
            const v = this.getRandomInt(0, nodes - 1);
            
            if (u === v) continue; // No self loops for simple graph
            
            const edgeKey = directed ? `${u}-${v}` : (u < v ? `${u}-${v}` : `${v}-${u}`);
            if (!edgeSet.has(edgeKey)) {
                edgeSet.add(edgeKey);
                const weight = weighted ? this.getRandomInt(minWeight, maxWeight) : 1;
                
                adjList[u].push(weighted ? { node: v, weight } : v);
                if (!directed) {
                    adjList[v].push(weighted ? { node: u, weight } : u);
                }
                edgesAdded++;
            }
            edgeAttempts++;
        }
        return adjList;
    }

    // --- EDGE CASE GENERATORS ---
    generateEdgeCases(type, constraints) {
        const cases = [];
        // Empty case
        if (type === 'array' || type === 'string' || type === 'matrix' || type === 'linkedlist' || type === 'binarytree' || type === 'graph') {
            cases.push({ description: "Empty input", input: (type === 'string' ? "" : (type === 'graph' ? {} : [])) });
        }
        
        // Single element
        if (type === 'array') cases.push({ description: "Single element", input: this.generateArray(1, constraints) });
        if (type === 'string') cases.push({ description: "Single character", input: this.generateString(1, constraints) });
        if (type === 'graph') cases.push({ description: "Single node", input: { "0": [] } });
        if (type === 'binarytree') cases.push({ description: "Single node tree", input: [this.getRandomInt(constraints?.min || -10, constraints?.max || 10)] });
        
        // Max constraint values
        if (constraints && constraints.max && type === 'array') {
            cases.push({ description: "All max values", input: new Array(constraints.size || 5).fill(constraints.max) });
        }
        
        // Duplicates (Array)
        if (type === 'array' && constraints && constraints.size > 1) {
            const val = this.getRandomInt(constraints.min || -100, constraints.max || 100);
            cases.push({ description: "All duplicates", input: new Array(constraints.size).fill(val) });
        }
        
        // Negative numbers
        if (type === 'array' && constraints && constraints.min === undefined) {
             cases.push({ description: "Only negative numbers", input: this.generateArray(constraints.size || 5, { min: -1000, max: -1 }) });
        }
        
        return cases;
    }
}

export default TestGenerator;
