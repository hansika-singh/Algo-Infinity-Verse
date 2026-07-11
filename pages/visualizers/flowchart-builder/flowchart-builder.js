/**
 * Drag-and-Drop Flowchart Builder for Algorithm Design
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    const state = {
        blocks: {}, // id -> { id, type, x, y, text }
        connections: [], // { id, from, fromPort, to, toPort }
        pan: { x: 0, y: 0 },
        zoom: 1,
        selectedBlockId: null,
        activeConnection: null, // { fromId, port, x, y }
        draggedPaletteType: null,
        isDraggingCanvas: false,
        lastMousePos: { x: 0, y: 0 }
    };

    // Shared drag state for block dragging (single set of window listeners, see initBlockDragging)
    const blockDrag = { id: null, startMouseX: 0, startMouseY: 0, startBlockX: 0, startBlockY: 0 };

    const CANVAS_WIDTH = 10000;
    const CANVAS_HEIGHT = 10000;
    
    // --- DOM Elements ---
    const paletteBlocks = document.querySelectorAll('.palette-block');
    const canvasContainer = document.getElementById('canvas-container');
    const canvasWrapper = document.getElementById('canvas-wrapper');
    const blocksLayer = document.getElementById('blocks-layer');
    const connectionsLayer = document.getElementById('connections-layer');
    const activeLine = document.getElementById('active-line');
    
    // Controls
    const btnSave = document.getElementById('btnSave');
    const btnRestore = document.getElementById('btnRestore');
    const btnClear = document.getElementById('btnClear');
    const btnValidate = document.getElementById('btnValidate');
    const btnZoomIn = document.getElementById('btnZoomIn');
    const btnZoomOut = document.getElementById('btnZoomOut');
    const btnResetZoom = document.getElementById('btnResetZoom');
    const validationMessage = document.getElementById('validationMessage');

    // --- Initialization ---
    initDragAndDrop();
    initCanvasPanZoom();
    initBlockDragging();
    initControls();
    centerCanvas();
    
    // --- Palette Drag & Drop ---
    function initDragAndDrop() {
        paletteBlocks.forEach(block => {
            block.addEventListener('dragstart', (e) => {
                state.draggedPaletteType = e.target.dataset.type;
                e.dataTransfer.setData('text/plain', e.target.dataset.type);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });

        canvasContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        canvasContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!state.draggedPaletteType) return;
            
            const rect = canvasContainer.getBoundingClientRect();
            // Calculate position relative to the scaled and panned wrapper
            let x = (e.clientX - rect.left - state.pan.x) / state.zoom;
            let y = (e.clientY - rect.top - state.pan.y) / state.zoom;
            
            // Adjust to center the block on the cursor (approximate)
            x -= 70; 
            y -= 30;

            addBlock(state.draggedPaletteType, x, y);
            state.draggedPaletteType = null;
        });
    }

    // --- Block Management ---
    function generateId() {
        return 'blk_' + Math.random().toString(36).substr(2, 9);
    }

    function addBlock(type, x, y, text = '', id = null) {
        const blockId = id || generateId();
        state.blocks[blockId] = {
            id: blockId,
            type: type,
            x: x,
            y: y,
            text: text || getDefaultText(type)
        };
        renderBlocks();
        return blockId;
    }

    function getDefaultText(type) {
        const map = {
            'start-end': 'Start',
            'process': 'Process',
            'io': 'Input',
            'decision': 'Condition',
            'loop': 'Loop',
            'variable': 'var x = 0'
        };
        return map[type] || 'Block';
    }

    function removeBlock(id) {
        delete state.blocks[id];
        // Remove related connections
        state.connections = state.connections.filter(c => c.from !== id && c.to !== id);
        renderBlocks();
        renderConnections();
    }

    function renderBlocks() {
        blocksLayer.innerHTML = '';
        
        Object.values(state.blocks).forEach(block => {
            const container = document.createElement('div');
            container.className = 'canvas-block-container';
            container.style.left = `${block.x}px`;
            container.style.top = `${block.y}px`;
            container.dataset.id = block.id;

            const inner = document.createElement('div');
            inner.className = `canvas-block ${state.selectedBlockId === block.id ? 'selected' : ''}`;
            inner.dataset.type = block.type;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'block-input';
            input.value = block.text;
            input.addEventListener('input', (e) => {
                state.blocks[block.id].text = e.target.value;
            });
            input.addEventListener('mousedown', (e) => e.stopPropagation()); // Allow focus
            
            inner.appendChild(input);
            container.appendChild(inner);

            // Delete button
            const delBtn = document.createElement('button');
            delBtn.className = 'block-delete';
            delBtn.innerHTML = '<i class="fas fa-times"></i>';
            delBtn.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                removeBlock(block.id);
            });
            container.appendChild(delBtn);

            // Connection points
            ['top', 'right', 'bottom', 'left'].forEach(pos => {
                const cp = document.createElement('div');
                cp.className = `connection-point cp-${pos}`;
                cp.dataset.port = pos;
                cp.dataset.id = block.id;
                
                cp.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    startConnection(block.id, pos, e);
                });
                
                cp.addEventListener('mouseup', (e) => {
                    if (state.activeConnection && state.activeConnection.fromId !== block.id) {
                        e.stopPropagation();
                        completeConnection(block.id, pos);
                    }
                });
                
                container.appendChild(cp);
            });

            // Block dragging (actual move handled by the single shared listener pair
            // set up once in initBlockDragging — see blockDrag state above)
            inner.addEventListener('mousedown', (e) => {
                if (e.target.classList.contains('block-input')) return;
                e.stopPropagation();

                selectBlock(block.id);
                blockDrag.id = block.id;
                blockDrag.startMouseX = e.clientX;
                blockDrag.startMouseY = e.clientY;
                blockDrag.startBlockX = block.x;
                blockDrag.startBlockY = block.y;
            });

            blocksLayer.appendChild(container);
        });
    }

    // Single, permanent pair of window listeners driving whichever block is
    // currently being dragged (identified via blockDrag.id), instead of a new
    // pair being attached per-block on every renderBlocks() call.
    function initBlockDragging() {
        window.addEventListener('mousemove', (e) => {
            if (!blockDrag.id) return;
            const block = state.blocks[blockDrag.id];
            if (!block) return;

            const dx = (e.clientX - blockDrag.startMouseX) / state.zoom;
            const dy = (e.clientY - blockDrag.startMouseY) / state.zoom;

            block.x = blockDrag.startBlockX + dx;
            block.y = blockDrag.startBlockY + dy;

            const container = blocksLayer.querySelector(`.canvas-block-container[data-id="${blockDrag.id}"]`);
            if (container) {
                container.style.left = `${block.x}px`;
                container.style.top = `${block.y}px`;
            }
            renderConnections();
        });

        window.addEventListener('mouseup', () => {
            blockDrag.id = null;
        });
    }

    function selectBlock(id) {
        state.selectedBlockId = id;
        document.querySelectorAll('.canvas-block').forEach(el => {
            el.classList.remove('selected');
            if (el.parentElement.dataset.id === id) {
                el.classList.add('selected');
            }
        });
    }

    // --- Connections ---
    function startConnection(blockId, port, e) {
        state.activeConnection = {
            fromId: blockId,
            port: port,
            startX: e.clientX,
            startY: e.clientY
        };
        
        window.addEventListener('mousemove', updateActiveConnection);
        window.addEventListener('mouseup', cancelActiveConnection);
    }

    function updateActiveConnection(e) {
        if (!state.activeConnection) return;
        
        const rect = canvasWrapper.getBoundingClientRect();
        
        // Starting point (approximate center of the connection point)
        const fromBlock = state.blocks[state.activeConnection.fromId];
        const fromPt = getPortCoords(fromBlock, state.activeConnection.port);
        
        // Current mouse point relative to wrapper
        const toX = (e.clientX - rect.left) / state.zoom;
        const toY = (e.clientY - rect.top) / state.zoom;
        
        drawPath(activeLine, fromPt.x, fromPt.y, toX, toY);
    }

    function completeConnection(toId, toPort) {
        if (!state.activeConnection) return;
        
        const fromId = state.activeConnection.fromId;
        const fromPort = state.activeConnection.port;
        
        // Prevent duplicate or self connections
        if (fromId === toId) return;
        
        const exists = state.connections.some(c => 
            (c.from === fromId && c.fromPort === fromPort && c.to === toId && c.toPort === toPort)
        );
        
        if (!exists) {
            state.connections.push({
                id: generateId(),
                from: fromId,
                fromPort: fromPort,
                to: toId,
                toPort: toPort
            });
            renderConnections();
        }
        
        cleanupActiveConnection();
    }

    function cancelActiveConnection() {
        if (state.activeConnection) {
            activeLine.setAttribute('d', '');
            cleanupActiveConnection();
        }
    }

    function cleanupActiveConnection() {
        state.activeConnection = null;
        window.removeEventListener('mousemove', updateActiveConnection);
        window.removeEventListener('mouseup', cancelActiveConnection);
    }

    function getPortCoords(block, port) {
        const w = 140; // canvas-block-container width
        const h = 60;  // canvas-block-container height
        let x = block.x;
        let y = block.y;
        
        switch (port) {
            case 'top': x += w/2; break;
            case 'right': x += w; y += h/2; break;
            case 'bottom': x += w/2; y += h; break;
            case 'left': y += h/2; break;
        }
        return { x, y };
    }

    function renderConnections() {
        // Keep defs and active line
        const defs = connectionsLayer.querySelector('defs');
        const active = connectionsLayer.querySelector('#active-line');
        connectionsLayer.innerHTML = '';
        connectionsLayer.appendChild(defs);
        connectionsLayer.appendChild(active);
        
        state.connections.forEach(conn => {
            const fromBlock = state.blocks[conn.from];
            const toBlock = state.blocks[conn.to];
            if (!fromBlock || !toBlock) return;
            
            const p1 = getPortCoords(fromBlock, conn.fromPort);
            const p2 = getPortCoords(toBlock, conn.toPort);
            
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.classList.add('connection-line');
            path.setAttribute('marker-end', 'url(#arrowhead)');
            path.dataset.id = conn.id;
            
            drawPath(path, p1.x, p1.y, p2.x, p2.y, conn.fromPort, conn.toPort);
            
            // Delete connection on click
            path.addEventListener('click', (e) => {
                e.stopPropagation();
                state.connections = state.connections.filter(c => c.id !== conn.id);
                renderConnections();
            });
            
            path.addEventListener('mouseenter', () => {
                path.setAttribute('marker-end', 'url(#arrowhead-hover)');
            });
            path.addEventListener('mouseleave', () => {
                if (path.classList.contains('invalid')) {
                    path.setAttribute('marker-end', 'url(#arrowhead-invalid)');
                } else {
                    path.setAttribute('marker-end', 'url(#arrowhead)');
                }
            });
            
            connectionsLayer.appendChild(path);
        });
    }

    function drawPath(pathEl, x1, y1, x2, y2, fromPort = 'right', toPort = 'left') {
        // Create an orthagonal bezier curve
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        let cp1x = x1, cp1y = y1, cp2x = x2, cp2y = y2;
        
        const offset = Math.max(dx / 2, 50);

        if (fromPort === 'right') cp1x += offset;
        else if (fromPort === 'left') cp1x -= offset;
        else if (fromPort === 'bottom') cp1y += offset;
        else if (fromPort === 'top') cp1y -= offset;

        if (toPort === 'left') cp2x -= offset;
        else if (toPort === 'right') cp2x += offset;
        else if (toPort === 'top') cp2y -= offset;
        else if (toPort === 'bottom') cp2y += offset;

        const d = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
        pathEl.setAttribute('d', d);
    }

    // --- Panning & Zooming ---
    function initCanvasPanZoom() {
        canvasContainer.addEventListener('mousedown', (e) => {
            if (e.target.closest('.canvas-block-container') || e.target.closest('path')) return;
            state.isDraggingCanvas = true;
            state.lastMousePos = { x: e.clientX, y: e.clientY };
            state.selectedBlockId = null; // Deselect block
            renderBlocks(); // re-render to remove selection class
        });

        window.addEventListener('mousemove', (e) => {
            if (!state.isDraggingCanvas) return;
            const dx = e.clientX - state.lastMousePos.x;
            const dy = e.clientY - state.lastMousePos.y;
            
            state.pan.x += dx;
            state.pan.y += dy;
            state.lastMousePos = { x: e.clientX, y: e.clientY };
            
            updateCanvasTransform();
        });

        window.addEventListener('mouseup', () => {
            state.isDraggingCanvas = false;
        });

        // Zooming via mouse wheel
        canvasContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomAmount = e.deltaY > 0 ? 0.9 : 1.1;
            zoomToPoint(zoomAmount, e.clientX, e.clientY);
        });
    }

    function zoomToPoint(zoomAmount, clientX, clientY) {
        const rect = canvasContainer.getBoundingClientRect();
        
        // Mouse pos relative to container
        const mouseX = clientX - rect.left;
        const mouseY = clientY - rect.top;
        
        // Old zoom
        const prevZoom = state.zoom;
        
        // New zoom
        let newZoom = state.zoom * zoomAmount;
        newZoom = Math.min(Math.max(0.2, newZoom), 2); // Clamp between 0.2 and 2
        
        state.zoom = newZoom;
        
        // Adjust pan to zoom towards mouse cursor
        state.pan.x = mouseX - (mouseX - state.pan.x) * (newZoom / prevZoom);
        state.pan.y = mouseY - (mouseY - state.pan.y) * (newZoom / prevZoom);
        
        updateCanvasTransform();
    }

    function updateCanvasTransform() {
        canvasWrapper.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
    }

    function centerCanvas() {
        const rect = canvasContainer.getBoundingClientRect();
        // Center the wrapper in the view
        state.pan.x = -(CANVAS_WIDTH / 2) + rect.width / 2;
        state.pan.y = -(CANVAS_HEIGHT / 2) + rect.height / 2;
        state.zoom = 1;
        updateCanvasTransform();
    }

    // --- Controls & Logic ---
    function initControls() {
        btnSave.addEventListener('click', saveFlowchart);
        btnRestore.addEventListener('click', loadFlowchart);
        btnClear.addEventListener('click', clearFlowchart);
        btnValidate.addEventListener('click', validateFlowchart);
        
        btnZoomIn.addEventListener('click', () => {
            const rect = canvasContainer.getBoundingClientRect();
            zoomToPoint(1.2, rect.left + rect.width/2, rect.top + rect.height/2);
        });
        
        btnZoomOut.addEventListener('click', () => {
            const rect = canvasContainer.getBoundingClientRect();
            zoomToPoint(0.8, rect.left + rect.width/2, rect.top + rect.height/2);
        });
        
        btnResetZoom.addEventListener('click', centerCanvas);
    }

    function saveFlowchart() {
        const data = {
            blocks: state.blocks,
            connections: state.connections
        };
        localStorage.setItem('flowchart_save', JSON.stringify(data));
        showMessage('Flowchart saved successfully!', 'success');
    }

    function loadFlowchart() {
        const saved = localStorage.getItem('flowchart_save');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                state.blocks = data.blocks || {};
                state.connections = data.connections || [];
                renderBlocks();
                renderConnections();
                showMessage('Flowchart loaded!', 'success');
            } catch (e) {
                showMessage('Failed to load flowchart.', 'error');
            }
        } else {
            showMessage('No saved flowchart found.', 'error');
        }
    }

    function clearFlowchart() {
        if(confirm('Are you sure you want to clear the canvas?')) {
            state.blocks = {};
            state.connections = [];
            renderBlocks();
            renderConnections();
            centerCanvas();
            showMessage('Canvas cleared.', 'success');
        }
    }

    function validateFlowchart() {
        // Reset invalid styles
        document.querySelectorAll('.canvas-block').forEach(el => el.classList.remove('invalid'));
        document.querySelectorAll('.connection-line').forEach(el => {
            el.classList.remove('invalid');
            el.setAttribute('marker-end', 'url(#arrowhead)');
        });

        let isValid = true;
        let startBlocks = 0;
        let endBlocks = 0;
        
        // Build graph
        const adj = {};
        const indegree = {};
        
        Object.keys(state.blocks).forEach(id => {
            adj[id] = [];
            indegree[id] = 0;
            const b = state.blocks[id];
            if (b.type === 'start-end') {
                if (b.text.toLowerCase().includes('start')) startBlocks++;
                else if (b.text.toLowerCase().includes('end')) endBlocks++;
                else {
                    // Assume start if no incoming
                }
            }
        });

        state.connections.forEach(conn => {
            if (adj[conn.from]) {
                adj[conn.from].push(conn.to);
                indegree[conn.to]++;
            }
        });

        // 1. Check if Start and End exist
        const missingBlocks = [];
        if (startBlocks === 0) missingBlocks.push('Start');
        if (endBlocks === 0) missingBlocks.push('End');
        if (missingBlocks.length > 0) {
            const label = missingBlocks.join(' and ') + (missingBlocks.length > 1 ? ' blocks' : ' block');
            showMessage(`Warning: Missing ${label}.`, 'error');
            isValid = false;
        }

        // 2. Check for disconnected blocks
        Object.values(state.blocks).forEach(block => {
            const isStart = block.type === 'start-end' && block.text.toLowerCase().includes('start');
            if (!isStart && indegree[block.id] === 0) {
                const el = document.querySelector(`.canvas-block-container[data-id="${block.id}"] .canvas-block`);
                if(el) el.classList.add('invalid');
                isValid = false;
            }
        });

        if (!isValid) {
            if (missingBlocks.length === 0) showMessage('Validation failed: Some blocks are unreachable.', 'error');
        } else {
            showMessage('Validation passed! Structure looks good.', 'success');
        }
    }

    function showMessage(msg, type) {
        validationMessage.textContent = msg;
        validationMessage.className = `validation-message ${type}`;
        validationMessage.style.display = 'block';
        setTimeout(() => {
            validationMessage.style.display = 'none';
        }, 4000);
    }
});
