import TestGenerator from './index.js';

function runTests() {
    const gen = new TestGenerator(42);
    const results = {};

    console.log("Testing Array generation...");
    try {
        results.array = gen.generateArray(10, { min: -5, max: 5, unique: true, sorted: true });
        results.arrayEdges = gen.generateEdgeCases('array', { size: 5, min: 0, max: 10 });
        console.log("Array tests passed.");
    } catch (e) {
        console.error("Array Error:", e.message);
    }

    console.log("Testing String generation...");
    try {
        results.string = gen.generateString(10, { unique: true });
        results.stringEdges = gen.generateEdgeCases('string', { size: 10 });
        console.log("String tests passed.");
    } catch (e) {
        console.error("String Error:", e.message);
    }

    console.log("Testing Matrix generation...");
    try {
        results.matrix = gen.generateMatrix(3, 4, { min: 1, max: 9 });
        results.matrixEdges = gen.generateEdgeCases('matrix', { size: 5 });
        console.log("Matrix tests passed.");
    } catch (e) {
        console.error("Matrix Error:", e.message);
    }

    console.log("Testing Linked List generation...");
    try {
        results.linkedlist = gen.generateLinkedList(5, { min: -10, max: 10 });
        results.linkedlistEdges = gen.generateEdgeCases('linkedlist', { size: 5 });
        console.log("Linked List tests passed.");
    } catch (e) {
        console.error("Linked List Error:", e.message);
    }

    console.log("Testing Binary Tree generation...");
    try {
        results.binarytree = gen.generateBinaryTree(7, { min: 1, max: 100, skewed: true, skewDirection: 'left' });
        results.binarytreeEdges = gen.generateEdgeCases('binarytree', { size: 5 });
        console.log("Binary Tree tests passed.");
    } catch (e) {
        console.error("Binary Tree Error:", e.message);
    }

    console.log("Testing BST generation...");
    try {
        results.bst = gen.generateBST(7, { min: 1, max: 100 });
        console.log("BST tests passed.");
    } catch (e) {
        console.error("BST Error:", e.message);
    }

    console.log("Testing Graph generation...");
    try {
        results.graph = gen.generateGraph(5, 7, { directed: true, weighted: true, minWeight: -5, maxWeight: 10 });
        results.graphEdges = gen.generateEdgeCases('graph', { size: 5 });
        console.log("Graph tests passed.");
    } catch (e) {
        console.error("Graph Error:", e.message);
    }
    
    console.log("\nSummary of Edge Cases Generated:");
    Object.keys(results).filter(k => k.endsWith('Edges')).forEach(k => {
        console.log(`- ${k}: ${results[k].length} edge cases`);
    });
}

runTests();
