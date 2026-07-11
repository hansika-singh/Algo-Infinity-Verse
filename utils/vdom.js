/**
 * Custom Lightweight Virtual DOM for High-FPS Algorithm Animations
 * Optimized for minimal layout thrashing and node reuse.
 */

// 1. Hyperscript Function to create Virtual Nodes
export function h(type, props, ...children) {
    return {
        type,
        props: props || {},
        children: children.flat().filter(c => c != null && c !== false),
        key: props && props.key ? props.key : null
    };
}

// 2. Diffing and Patching Engine
export function diff(oldVNode, newVNode) {
    if (newVNode === undefined) {
        return (node) => {
            node.remove();
            return undefined;
        };
    }

    if (typeof oldVNode === 'string' || typeof newVNode === 'string' ||
        typeof oldVNode === 'number' || typeof newVNode === 'number') {
        if (oldVNode !== newVNode) {
            return (node) => {
                const newNode = document.createTextNode(newVNode);
                node.replaceWith(newNode);
                return newNode;
            };
        }
        return (node) => node;
    }

    if (oldVNode.type !== newVNode.type) {
        return (node) => {
            const newNode = renderNode(newVNode);
            node.replaceWith(newNode);
            return newNode;
        };
    }

    const patchProps = diffProps(oldVNode.props, newVNode.props);
    const patchChildren = diffChildren(oldVNode.children, newVNode.children);

    return (node) => {
        patchProps(node);
        patchChildren(node);
        return node;
    };
}

// Diff properties (attributes and styles)
function diffProps(oldProps, newProps) {
    const patches = [];

    // Set new or updated props
    for (const [key, value] of Object.entries(newProps)) {
        if (key === 'key') continue; // key is internal
        
        if (key === 'style' && typeof value === 'object') {
            const oldStyle = oldProps.style || {};
            for (const [styleKey, styleValue] of Object.entries(value)) {
                if (oldStyle[styleKey] !== styleValue) {
                    patches.push((node) => {
                        node.style[styleKey] = styleValue;
                    });
                }
            }
        } else if (key.startsWith('on')) {
            const eventName = key.toLowerCase().substring(2);
            if (oldProps[key] !== value) {
                patches.push((node) => {
                    if (oldProps[key]) node.removeEventListener(eventName, oldProps[key]);
                    if (value) node.addEventListener(eventName, value);
                });
            }
        } else if (oldProps[key] !== value) {
            patches.push((node) => {
                if (key === 'className') {
                    node.className = value;
                } else if (key === 'id') {
                    node.id = value;
                } else {
                    node.setAttribute(key, value);
                }
            });
        }
    }

    // Remove old props
    for (const key in oldProps) {
        if (key === 'key') continue;
        if (!(key in newProps)) {
            patches.push((node) => {
                if (key.startsWith('on')) {
                    const eventName = key.toLowerCase().substring(2);
                    node.removeEventListener(eventName, oldProps[key]);
                } else if (key === 'className') {
                    node.className = '';
                } else if (key === 'style') {
                    node.style = '';
                } else {
                    node.removeAttribute(key);
                }
            });
        }
    }

    return (node) => {
        for (const patch of patches) patch(node);
    };
}

// Diff children arrays
function diffChildren(oldChildren, newChildren) {
    const childPatches = [];
    const additionalPatches = [];
    
    // Simple diffing without complex key-based reordering for now,
    // assuming animations primarily update properties in-place or add/remove from ends.
    oldChildren.forEach((oldChild, i) => {
        childPatches.push(diff(oldChild, newChildren[i]));
    });

    for (let i = oldChildren.length; i < newChildren.length; i++) {
        additionalPatches.push((node) => {
            node.appendChild(renderNode(newChildren[i]));
            return node;
        });
    }

    return (parent) => {
        const domChildren = Array.from(parent.childNodes);
        childPatches.forEach((patch, i) => {
            if (domChildren[i]) {
                patch(domChildren[i]);
            }
        });

        additionalPatches.forEach((patch) => {
            patch(parent);
        });

        return parent;
    };
}

// Initial render to real DOM
export function renderNode(vnode) {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        return document.createTextNode(String(vnode));
    }

    const node = document.createElement(vnode.type);
    
    if (vnode.props) {
        for (const [key, value] of Object.entries(vnode.props)) {
            if (key === 'key') continue;
            
            if (key === 'style' && typeof value === 'object') {
                Object.assign(node.style, value);
            } else if (key.startsWith('on')) {
                const eventName = key.toLowerCase().substring(2);
                node.addEventListener(eventName, value);
            } else if (key === 'className') {
                node.className = value;
            } else if (key === 'id') {
                node.id = value;
            } else {
                node.setAttribute(key, value);
            }
        }
    }

    if (vnode.children) {
        vnode.children.forEach(child => {
            if (child != null) {
                node.appendChild(renderNode(child));
            }
        });
    }

    return node;
}

// 3. Renderer Wrapper (Handles rAF Batching)
export function createRenderer(rootElement) {
    let oldVNode = null;
    let pendingVNode = null;
    let isRenderPending = false;

    function renderLoop() {
        if (!pendingVNode) {
            isRenderPending = false;
            return;
        }

        if (!oldVNode) {
            // First render
            const newDOM = renderNode(pendingVNode);
            rootElement.innerHTML = '';
            rootElement.appendChild(newDOM);
        } else {
            // Diff and patch
            const patch = diff(oldVNode, pendingVNode);
            patch(rootElement.firstChild);
        }

        oldVNode = pendingVNode;
        pendingVNode = null;
        isRenderPending = false;
    }

    return function update(newVNode) {
        pendingVNode = newVNode;
        if (!isRenderPending) {
            isRenderPending = true;
            requestAnimationFrame(renderLoop);
        }
    };
}
