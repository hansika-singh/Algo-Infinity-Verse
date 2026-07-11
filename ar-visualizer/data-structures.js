export class TreeNode {
    constructor(value) {
        this.value = value;
        this.left = null;
        this.right = null;
        this.mesh = null; // Reference to Three.js mesh for the node
        this.lineMesh = null; // Reference to the line connecting to parent
        this.targetPosition = { x: 0, y: 0, z: 0 }; // For smooth animation
    }
}

export class BinarySearchTree {
    constructor() {
        this.root = null;
    }

    insert(value) {
        const newNode = new TreeNode(value);
        if (!this.root) {
            this.root = newNode;
            return { node: newNode, isNew: true };
        }

        let current = this.root;
        while (true) {
            if (value === current.value) return { node: current, isNew: false }; // No duplicates for simplicity
            
            if (value < current.value) {
                if (!current.left) {
                    current.left = newNode;
                    return { node: newNode, parent: current, isNew: true };
                }
                current = current.left;
            } else {
                if (!current.right) {
                    current.right = newNode;
                    return { node: newNode, parent: current, isNew: true };
                }
                current = current.right;
            }
        }
    }

    // Recalculates 3D layout coordinates for all nodes
    // Using a simple algorithm: root is at (0, 0, -2) (in front of user).
    // Left children go -x, -y. Right children go +x, -y.
    updateLayout() {
        if (!this.root) return;

        const levelHeight = 0.4;
        const baseWidth = 1.0;

        const updateNode = (node, depth, xPos, zOffset) => {
            if (!node) return;

            // Set target position for the node
            node.targetPosition = {
                x: xPos,
                y: -depth * levelHeight, // Moving down in AR space
                z: zOffset // slightly pushed back
            };

            // Calculate width spread based on depth to avoid overlap
            const spread = baseWidth / Math.pow(1.5, depth);

            if (node.left) {
                updateNode(node.left, depth + 1, xPos - spread, zOffset);
            }
            if (node.right) {
                updateNode(node.right, depth + 1, xPos + spread, zOffset);
            }
        };

        // Root position: centered horizontally, at eye level (y=0 initially, maybe slightly down), 1.5 meters away
        updateNode(this.root, 0, 0, -1.5);
    }
    
    // Generator for In-Order Traversal (returns nodes one by one for animation)
    *inorderTraversal(node = this.root) {
        if (node) {
            yield* this.inorderTraversal(node.left);
            yield node;
            yield* this.inorderTraversal(node.right);
        }
    }

    // Generator for Pre-Order Traversal
    *preorderTraversal(node = this.root) {
        if (node) {
            yield node;
            yield* this.preorderTraversal(node.left);
            yield* this.preorderTraversal(node.right);
        }
    }

    // Generator for Post-Order Traversal
    *postorderTraversal(node = this.root) {
        if (node) {
            yield* this.postorderTraversal(node.left);
            yield* this.postorderTraversal(node.right);
            yield node;
        }
    }
}
