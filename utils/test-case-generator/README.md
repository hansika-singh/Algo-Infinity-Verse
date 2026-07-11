# Procedural Test Case Generation Engine

A Node.js-based procedural test case generation engine for Data Structures and Algorithms (DSA) problems.

## Features

- **Generates Data Structures**: Arrays, Strings, Linked Lists, Binary Trees, Binary Search Trees, Graphs, Matrices.
- **Edge Cases**: Automatically includes empty inputs, single elements, max constraint values, duplicates, and negative numbers depending on the data type.
- **Randomness & Seeding**: Support for pseudo-random seeded generation for reproducible test cases.
- **Configurable Constraints**: Size, limits, uniqueness, sorting order, density, directed vs undirected graphs, etc.
- **JSON Export**: Batch generate cases directly to a JSON file.

## Usage (CLI)

You can run the generator via the command line interface using `cli.js`.

### Using a Config File (Recommended)

```bash
node cli.js --config templates/array_template.json --output array_tests.json
```

### Using Command Line Flags

```bash
node cli.js --type array --size 50 --count 5 --output test.json --min 1 --max 100 --edgeCases
```

### CLI Options

| Flag | Description |
| ---- | ----------- |
| `--config` | Path to a configuration JSON file. |
| `--output` | Output JSON file path. |
| `--type` | The type of data structure (`array`, `string`, `matrix`, `linkedlist`, `binarytree`, `bst`, `graph`). |
| `--size` | Number of elements (for arrays, strings, trees, linked lists). |
| `--count` | Number of random test cases to batch generate. |
| `--min` | Minimum value for generated elements. |
| `--max` | Maximum value for generated elements. |
| `--unique` | Ensure all elements are unique (Boolean). |
| `--sorted` | Sort elements in ascending order (Boolean). |
| `--reverse` | Sort elements in descending order (Boolean). |
| `--seed` | Provide an integer seed for reproducible randomness. |
| `--edgeCases`| Append edge cases to the batch generation (Boolean). |
| `--nodes` | Number of nodes (for graphs). |
| `--edges` | Number of edges (for graphs). |
| `--directed` | Generate a directed graph (Boolean). |
| `--weighted` | Generate a weighted graph (Boolean). |
| `--rows` | Number of rows (for matrices). |
| `--cols` | Number of columns (for matrices). |

## Using Programmatically

```javascript
import TestGenerator from './index.js';

const generator = new TestGenerator(12345); // Seeded

// Generate an Array
const arr = generator.generateArray(10, { min: -10, max: 10, unique: true });

// Generate a Graph
const graph = generator.generateGraph(5, 7, { directed: true, weighted: true, minWeight: 1, maxWeight: 5 });

// Generate Edge Cases for Arrays
const edges = generator.generateEdgeCases('array', { size: 10, min: 0, max: 100 });
```

## Structure Output Types

- **Arrays / Linked Lists**: Standard JSON arrays. `[1, 2, 3]`
- **Strings**: Standard JSON strings. `"abc"`
- **Matrices**: 2D JSON arrays. `[[1, 2], [3, 4]]`
- **Trees (Binary Tree / BST)**: Level-order traversal array representation where `null` represents an empty node. `[1, 2, 3, null, 5]`
- **Graphs**: Adjacency list representation using an object mapping.
  - Unweighted: `{"0": [1, 2], "1": [0], "2": [0]}`
  - Weighted: `{"0": [{"node": 1, "weight": 5}]}`
