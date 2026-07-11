#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import TestGenerator from './index.js';
import { fileURLToPath } from 'url';

function showHelp() {
    console.log(`
Procedural Test Case Generation Engine for DSA Problems

Usage:
  node cli.js --config <path-to-config.json>
  node cli.js --type <type> --size <size> --count <count> --output <out.json> [options]

Types supported: array, string, matrix, linkedlist, binarytree, bst, graph

Options for CLI flags:
  --min <number>         Minimum value for elements
  --max <number>         Maximum value for elements
  --unique               Ensure elements are unique
  --sorted               Sort generated arrays
  --reverse              Reverse sort generated arrays
  --seed <number>        Random seed for reproducible outputs
  --edgeCases            Include edge cases in output
  --nodes <number>       Number of nodes (for graphs)
  --edges <number>       Number of edges (for graphs)
  --directed             Directed graph
  --weighted             Weighted graph
  --rows <number>        Rows for matrices
  --cols <number>        Columns for matrices

Examples:
  node cli.js --type array --size 50 --count 5 --output test.json --min 1 --max 100
  node cli.js --config ./templates/array_config.json
`);
}

function parseArgs() {
    const args = process.argv.slice(2);
    const parsed = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i].startsWith('--')) {
            const key = args[i].slice(2);
            let val = true;
            if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
                val = args[++i];
                if (!isNaN(val)) val = Number(val);
                else if (val === 'true') val = true;
                else if (val === 'false') val = false;
            }
            parsed[key] = val;
        }
    }
    return parsed;
}

function generateFromConfig(config) {
    const generator = new TestGenerator(config.seed || null);
    const type = config.type ? config.type.toLowerCase() : null;
    const count = config.count || 1;
    const options = config.options || {};
    const size = config.size || 10;
    
    let dataset = [];

    // Add Edge Cases if requested
    if (config.edgeCases) {
        dataset = dataset.concat(generator.generateEdgeCases(type, { size, ...options }));
    }

    for (let i = 0; i < count; i++) {
        let input;
        switch (type) {
            case 'array':
                input = generator.generateArray(size, options);
                break;
            case 'string':
                input = generator.generateString(size, options);
                break;
            case 'linkedlist':
                input = generator.generateLinkedList(size, options);
                break;
            case 'binarytree':
                input = generator.generateBinaryTree(size, options);
                break;
            case 'bst':
                input = generator.generateBST(size, options);
                break;
            case 'graph':
                input = generator.generateGraph(config.nodes || 10, config.edges || 15, options);
                break;
            case 'matrix':
                input = generator.generateMatrix(config.rows || 5, config.cols || 5, options);
                break;
            default:
                throw new Error(`Unsupported type: ${type}`);
        }
        dataset.push({
            description: `Random generated ${type} test case`,
            input
        });
    }

    return dataset;
}

function main() {
    const args = parseArgs();
    
    if (args.help) {
        return showHelp();
    }

    let config = {};

    if (args.config) {
        const configPath = path.resolve(process.cwd(), args.config);
        if (!fs.existsSync(configPath)) {
            console.error(`Config file not found: ${configPath}`);
            process.exit(1);
        }
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
        if (!args.type) {
            console.error("Missing --type or --config.");
            return showHelp();
        }
        config = {
            type: args.type,
            size: args.size,
            count: args.count,
            seed: args.seed,
            edgeCases: args.edgeCases,
            nodes: args.nodes,
            edges: args.edges,
            rows: args.rows,
            cols: args.cols,
            options: {
                min: args.min,
                max: args.max,
                unique: args.unique,
                sorted: args.sorted,
                reverse: args.reverse,
                directed: args.directed,
                weighted: args.weighted
            }
        };
    }

    try {
        const dataset = generateFromConfig(config);
        const output = {
            metadata: {
                generatedAt: new Date().toISOString(),
                config: config,
                totalCases: dataset.length
            },
            testCases: dataset
        };

        const outputPath = path.resolve(process.cwd(), args.output || 'testcases.json');
        fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
        console.log(`Successfully generated ${dataset.length} test cases and saved to ${outputPath}`);
    } catch (e) {
        console.error("Error generating test cases:", e.message);
        process.exit(1);
    }
}

const __filename = fileURLToPath(import.meta.url);
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
    main();
}

export { generateFromConfig };
