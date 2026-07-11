import { BinarySearchTree, TreeNode } from '../ar-visualizer/data-structures.js';

describe('AR Visualizer - Binary Search Tree', () => {
    let bst;

    beforeEach(() => {
        bst = new BinarySearchTree();
    });

    test('should initialize with null root', () => {
        expect(bst.root).toBeNull();
    });

    test('should insert first node as root', () => {
        const { node, isNew } = bst.insert(10);
        expect(isNew).toBe(true);
        expect(bst.root).toBe(node);
        expect(bst.root.value).toBe(10);
    });

    test('should insert left and right children correctly', () => {
        bst.insert(10);
        bst.insert(5);
        bst.insert(15);

        expect(bst.root.value).toBe(10);
        expect(bst.root.left.value).toBe(5);
        expect(bst.root.right.value).toBe(15);
    });

    test('should handle duplicate inserts gracefully', () => {
        bst.insert(10);
        const { node, isNew } = bst.insert(10);
        
        expect(isNew).toBe(false);
        expect(node.value).toBe(10);
        expect(bst.root.left).toBeNull();
        expect(bst.root.right).toBeNull();
    });

    test('should handle deep left-heavy and right-heavy trees', () => {
        // Left heavy
        bst.insert(10);
        bst.insert(8);
        bst.insert(6);
        bst.insert(4);

        expect(bst.root.left.left.left.value).toBe(4);

        // Right heavy
        bst.insert(15);
        bst.insert(20);
        bst.insert(25);

        expect(bst.root.right.right.right.value).toBe(25);
    });

    describe('Layout Calculation', () => {
        test('should calculate target positions for nodes without errors', () => {
            bst.insert(10);
            bst.insert(5);
            bst.insert(15);
            
            bst.updateLayout();

            // Root
            expect(bst.root.targetPosition).toBeDefined();
            expect(bst.root.targetPosition.x).toBeCloseTo(0);
            expect(bst.root.targetPosition.y).toBeCloseTo(0);
            expect(bst.root.targetPosition.z).toBeCloseTo(-1.5);

            // Left child
            expect(bst.root.left.targetPosition).toBeDefined();
            expect(bst.root.left.targetPosition.x).toBeLessThan(0); // Should be to the left
            expect(bst.root.left.targetPosition.y).toBeLessThan(0); // Should be lower

            // Right child
            expect(bst.root.right.targetPosition).toBeDefined();
            expect(bst.root.right.targetPosition.x).toBeGreaterThan(0); // Should be to the right
        });

        test('should handle layout calculation on empty tree', () => {
            expect(() => bst.updateLayout()).not.toThrow();
        });
    });

    describe('Traversals', () => {
        beforeEach(() => {
            // Setup a small tree:
            //       10
            //     /    \
            //    5      15
            //   / \    /  \
            //  3   7  12  18
            [10, 5, 15, 3, 7, 12, 18].forEach(val => bst.insert(val));
        });

        test('Inorder traversal should return sorted nodes', () => {
            const generator = bst.inorderTraversal();
            const result = [];
            for (let node of generator) {
                result.push(node.value);
            }
            expect(result).toEqual([3, 5, 7, 10, 12, 15, 18]);
        });

        test('Preorder traversal should return nodes in root-left-right order', () => {
            const generator = bst.preorderTraversal();
            const result = [];
            for (let node of generator) {
                result.push(node.value);
            }
            expect(result).toEqual([10, 5, 3, 7, 15, 12, 18]);
        });

        test('Postorder traversal should return nodes in left-right-root order', () => {
            const generator = bst.postorderTraversal();
            const result = [];
            for (let node of generator) {
                result.push(node.value);
            }
            expect(result).toEqual([3, 7, 5, 12, 18, 15, 10]);
        });

        test('Traversals on empty tree should yield nothing', () => {
            const emptyBst = new BinarySearchTree();
            const generator = emptyBst.inorderTraversal();
            const result = [];
            for (let node of generator) {
                result.push(node.value);
            }
            expect(result).toEqual([]);
        });
    });
});
