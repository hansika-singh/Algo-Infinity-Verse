import TestGenerator from './index.js';

function runCustomTests() {
    const gen = new TestGenerator(42);
    let successCount = 0;
    let failCount = 0;

    const test = (name, fn) => {
        try {
            fn();
            console.log(`✅ ${name}`);
            successCount++;
        } catch (e) {
            console.log(`❌ ${name} - Error: ${e.message}`);
            failCount++;
        }
    };

    // Test 1: Unique array with exact bounds
    test("Array: Unique with exact bounds", () => {
        const arr = gen.generateArray(5, { min: 1, max: 5, unique: true });
        if (arr.length !== 5 || new Set(arr).size !== 5) throw new Error("Did not generate unique array properly");
    });

    // Test 2: Unique array with impossible bounds
    test("Array: Unique with impossible bounds throws error", () => {
        let threw = false;
        try {
            gen.generateArray(5, { min: 1, max: 4, unique: true });
        } catch (e) {
            threw = true;
        }
        if (!threw) throw new Error("Should have thrown error");
    });

    // Test 3: String unique chars
    test("String: Unique chars", () => {
        const str = gen.generateString(5, { unique: true, charSet: 'abcde' });
        if (str.length !== 5 || new Set(str.split('')).size !== 5) throw new Error("Not unique chars");
    });

    // Test 4: Directed Graph
    test("Graph: Directed", () => {
        const g = gen.generateGraph(3, 4, { directed: true }); // Max edges is 3*2=6
        let totalEdges = 0;
        for (let u in g) totalEdges += g[u].length;
        if (totalEdges !== 4) throw new Error(`Expected 4 edges, got ${totalEdges}`);
    });

    // Test 5: Undirected Graph
    test("Graph: Undirected", () => {
        const g = gen.generateGraph(3, 3, { directed: false }); // Max edges is 3*2/2 = 3
        let totalEdges = 0;
        for (let u in g) totalEdges += g[u].length;
        // undirected edges appear in both lists, so sum is 2 * edges
        if (totalEdges !== 6) throw new Error(`Expected 6 directed entries for 3 undirected edges, got ${totalEdges}`);
    });

    // Test 6: BST generation
    test("BST: Generation bounds", () => {
        const bst = gen.generateBST(7, { min: 10, max: 20 });
        const vals = bst.filter(x => x !== null);
        if (vals.length !== 7 || Math.min(...vals) < 10 || Math.max(...vals) > 20) throw new Error("BST bounds not respected");
    });

    // Test 7: CLI function directly
    test("CLI: generateFromConfig", async () => {
        const { generateFromConfig } = await import('./cli.js');
        const res = generateFromConfig({
            type: 'binarytree',
            size: 5,
            edgeCases: true,
            options: { min: -5, max: 5 }
        });
        if (res.length < 2) throw new Error("Expected batch result + edge cases");
    });

    console.log(`\nTests finished: ${successCount} passed, ${failCount} failed.`);
}

runCustomTests();
