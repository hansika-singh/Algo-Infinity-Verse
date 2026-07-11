import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { BinarySearchTree } from './data-structures.js';

// --- Scene Setup ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// Camera setup for non-AR fallback. In AR, WebXR overrides the camera.
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
camera.position.set(0, 0, 2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true; // Enable WebXR
container.appendChild(renderer.domElement);

// --- Lights ---
const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
light.position.set(0.5, 1, 0.25);
scene.add(light);

// --- AR Button ---
const arButtonContainer = document.getElementById('ar-button-container');
const arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] });
arButtonContainer.appendChild(arButton);

// Adjust UI when entering/exiting AR
renderer.xr.addEventListener('sessionstart', () => {
    document.body.classList.add('in-ar');
});
renderer.xr.addEventListener('sessionend', () => {
    document.body.classList.remove('in-ar');
    // Re-center camera on exit
    camera.position.set(0, 0, 2);
    camera.lookAt(0, 0, 0);
});

// --- Data Structure State ---
const bst = new BinarySearchTree();
const nodesGroup = new THREE.Group();
const edgesGroup = new THREE.Group();
scene.add(nodesGroup);
scene.add(edgesGroup);

// --- Materials ---
const nodeMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x6366f1, // Indigo
    roughness: 0.3,
    metalness: 0.2
});
const highlightMaterial = new THREE.MeshStandardMaterial({
    color: 0xf59e0b, // Amber (for traversals/highlights)
    roughness: 0.3,
    metalness: 0.8
});
const edgeMaterial = new THREE.LineBasicMaterial({
    color: 0x9ca3af, // Gray
    linewidth: 2 // Note: WebGL standard only supports linewidth 1 on most platforms
});

// Helper for drawing lines between nodes
function updateEdges() {
    // Clear old edges
    while(edgesGroup.children.length > 0){ 
        edgesGroup.remove(edgesGroup.children[0]); 
    }

    const drawEdge = (node) => {
        if (!node) return;
        
        if (node.left && node.mesh && node.left.mesh) {
            const points = [node.mesh.position, node.left.mesh.position];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, edgeMaterial);
            edgesGroup.add(line);
        }
        
        if (node.right && node.mesh && node.right.mesh) {
            const points = [node.mesh.position, node.right.mesh.position];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, edgeMaterial);
            edgesGroup.add(line);
        }

        drawEdge(node.left);
        drawEdge(node.right);
    };

    drawEdge(bst.root);
}

// --- Interaction (Raycasting) ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// For desktop touch/click
function onPointerDown(event) {
    if (document.body.classList.contains('in-ar')) {
        // In AR mode, we might want to handle controllers instead of screen taps directly
        // But for mobile AR, screen tap is often mapped to mouse click on the canvas
        // This is a basic implementation. Real AR needs XRController hit testing.
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    } else {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(nodesGroup.children);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        showPopup(object.userData.value, object.userData.height);
    } else {
        hidePopup();
    }
}
window.addEventListener('pointerdown', onPointerDown);

// --- UI Logic ---
const popup = document.getElementById('node-info-popup');
const popupValue = document.getElementById('popup-value');
function showPopup(val, height) {
    popupValue.innerText = `Node: ${val}`;
    popup.classList.remove('hidden');
}
function hidePopup() {
    popup.classList.add('hidden');
}

document.getElementById('insert-btn').addEventListener('click', () => {
    const input = document.getElementById('node-value');
    const val = parseInt(input.value);
    if (isNaN(val)) return;

    const { node, isNew } = bst.insert(val);
    
    if (isNew) {
        // Create 3D Object
        const geometry = new THREE.SphereGeometry(0.1, 32, 16);
        const mesh = new THREE.Mesh(geometry, nodeMaterial);
        
        // Add text label using HTML/CSS 2D object or a simple texture. 
        // For simplicity in this demo, we rely on the popup for exact value.
        mesh.userData = { value: val, height: 0 };
        node.mesh = mesh;
        
        // Initial position (animate from root)
        if (bst.root !== node) {
             mesh.position.copy(bst.root.mesh.position);
        } else {
             mesh.position.set(0, 0.5, -1.5); // starting root high
        }
        
        nodesGroup.add(mesh);
    }

    bst.updateLayout();
    input.value = '';
    input.focus();
});

document.getElementById('reset-btn').addEventListener('click', () => {
    bst.root = null;
    while(nodesGroup.children.length > 0){ 
        nodesGroup.remove(nodesGroup.children[0]); 
    }
    while(edgesGroup.children.length > 0){ 
        edgesGroup.remove(edgesGroup.children[0]); 
    }
    hidePopup();
});

// Traversal Animation Logic
let isTraversing = false;
async function animateTraversal(generator) {
    if (isTraversing) return;
    isTraversing = true;
    
    for (const node of generator) {
        if (!node.mesh) continue;
        
        const originalMat = node.mesh.material;
        node.mesh.material = highlightMaterial;
        
        // Scale up slightly for emphasis
        node.mesh.scale.set(1.3, 1.3, 1.3);
        
        // Wait 800ms
        await new Promise(r => setTimeout(r, 800));
        
        // Revert
        node.mesh.material = originalMat;
        node.mesh.scale.set(1, 1, 1);
    }
    isTraversing = false;
}

document.getElementById('traverse-inorder').addEventListener('click', () => {
    animateTraversal(bst.inorderTraversal());
});
document.getElementById('traverse-preorder').addEventListener('click', () => {
    animateTraversal(bst.preorderTraversal());
});
document.getElementById('traverse-postorder').addEventListener('click', () => {
    animateTraversal(bst.postorderTraversal());
});

// --- Animation Loop ---
function render() {
    // Animate nodes towards their target positions (lerping)
    const traverseAndLerp = (node) => {
        if (!node) return;
        if (node.mesh) {
            node.mesh.position.lerp(new THREE.Vector3(
                node.targetPosition.x, 
                node.targetPosition.y, 
                node.targetPosition.z
            ), 0.05); // Lerp factor
        }
        traverseAndLerp(node.left);
        traverseAndLerp(node.right);
    };
    
    traverseAndLerp(bst.root);
    
    // Edges need to constantly update while nodes are moving
    if (nodesGroup.children.length > 0) {
        updateEdges();
    }

    // Gentle floating rotation for desktop fallback view
    if (!document.body.classList.contains('in-ar')) {
        // Optional: gently rotate the whole group if desired, or keep it static
    }

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(render);

// --- Window Resize ---
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
