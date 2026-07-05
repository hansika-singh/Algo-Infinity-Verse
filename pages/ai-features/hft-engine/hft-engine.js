/**
 * hft-engine.js
 * Implements a high-performance L2 Matching Engine.
 * Utilizes SharedArrayBuffer for a Lock-Free Ring Buffer where Web Workers (Bots)
 * inject orders, and the main thread processes them into an Order Book.
 * Includes a fallback to postMessage for environments lacking COOP/COEP headers.
 */

document.addEventListener("DOMContentLoaded", () => {
    initHFTEngine();
});

// --- Config & Globals ---
const CONFIG = {
    CAPACITY: 10000, // Ring Buffer size
    HEADER_SIZE: 2,  // [readIdx, writeIdx]
    ORDER_SIZE: 4,   // [isReady, type(0=Bid,1=Ask), price, qty]
    START_PRICE: 10000 // $100.00 in cents
};

// State
let sab, view;
let isSABSupported = false;
let isTrading = false;
let workers = [];
let orderBook = { bids: new Map(), asks: new Map() }; // price -> qty
let sortedBids = [];
let sortedAsks = [];
let marketPrice = CONFIG.START_PRICE;

// Telemetry State
let metrics = { totalOrders: 0, totalTrades: 0, lastOrders: 0, opsPerSec: 0 };
let renderTimer, metricsTimer;

// DOM Elements
const els = {
    sabWarning: document.getElementById('sabWarning'),
    btnAcceptFallback: document.getElementById('btnAcceptFallback'),
    engineBadge: document.getElementById('engineBadge'),
    btnStartTrading: document.getElementById('btnStartTrading'),
    btnStopTrading: document.getElementById('btnStopTrading'),
    botCountSlider: document.getElementById('botCountSlider'),
    botCountVal: document.getElementById('botCountVal'),
    
    statOrdersTotal: document.getElementById('statOrdersTotal'),
    statTradesTotal: document.getElementById('statTradesTotal'),
    statOpsPerSec: document.getElementById('statOpsPerSec'),
    statSpread: document.getElementById('statSpread'),
    
    canvas: document.getElementById('depthCanvas'),
    wrapper: document.getElementById('canvasWrapper'),
    
    bookAsks: document.getElementById('bookAsks'),
    bookBids: document.getElementById('bookBids'),
    bookSpreadDisplay: document.getElementById('bookSpreadDisplay'),
    tradeTape: document.getElementById('tradeTape')
};

let ctx;

// ==========================================
// 1. INITIALIZATION
// ==========================================
function initHFTEngine() {
    ctx = els.canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    checkCapabilities();
    bindEvents();
    
    // Initial blank render
    renderMarketDepth();
    renderOrderBookUI();
}

function checkCapabilities() {
    if (typeof SharedArrayBuffer !== 'undefined') {
        isSABSupported = true;
        allocateSharedMemory();
    } else {
        els.sabWarning.classList.remove('hidden');
        els.btnAcceptFallback.addEventListener('click', () => {
            els.sabWarning.classList.add('hidden');
            els.engineBadge.classList.add('fallback');
            els.engineBadge.innerHTML = '<i class="fas fa-exclamation-circle"></i> Fallback Mode (postMessage)';
        });
    }
}

function bindEvents() {
    els.btnStartTrading.addEventListener('click', startTrading);
    els.btnStopTrading.addEventListener('click', stopTrading);
    els.botCountSlider.addEventListener('input', (e) => {
        els.botCountVal.textContent = e.target.value;
    });
}

function resizeCanvas() {
    const rect = els.wrapper.getBoundingClientRect();
    els.canvas.width = rect.width * window.devicePixelRatio;
    els.canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

// ==========================================
// 2. MEMORY ALLOCATION & WORKER LOGIC
// ==========================================
function allocateSharedMemory() {
    const totalBytes = (CONFIG.HEADER_SIZE + (CONFIG.CAPACITY * CONFIG.ORDER_SIZE)) * 4;
    sab = new SharedArrayBuffer(totalBytes);
    view = new Int32Array(sab);
    // Init headers
    view[0] = 0; // readIdx
    view[1] = 0; // writeIdx
}

const workerBlobCode = `
self.onmessage = function(e) {
    const { sab, isSABSupported, capacity, headerSize, orderSize, startPrice } = e.data;
    let view = isSABSupported ? new Int32Array(sab) : null;
    let isRunning = true;
    let currentPrice = startPrice;

    // Random walk price generator
    function generateOrder() {
        if (!isRunning) return;
        
        // Random walk the fair price
        currentPrice += Math.floor(Math.random() * 11) - 5; 
        
        // 0 = Bid, 1 = Ask
        const type = Math.random() > 0.5 ? 1 : 0; 
        
        // Bids are slightly below current price, Asks slightly above
        const offset = Math.floor(Math.random() * 20);
        const price = type === 0 ? currentPrice - offset : currentPrice + offset;
        const qty = Math.floor(Math.random() * 50) + 1;

        if (isSABSupported) {
            // Lock-Free Ring Buffer Injection
            let writeIdx = Atomics.add(view, 1, 1) % capacity;
            let offsetIdx = headerSize + (writeIdx * orderSize);
            
            // Only write if slot is empty (0)
            if (Atomics.load(view, offsetIdx) === 0) {
                view[offsetIdx + 1] = type;
                view[offsetIdx + 2] = price;
                view[offsetIdx + 3] = qty;
                // Commit order
                Atomics.store(view, offsetIdx, 1);
            }
        } else {
            // Fallback
            self.postMessage({ type, price, qty });
        }
        
        // Extremely high frequency injection
        setTimeout(generateOrder, Math.random() * 5); 
    }

    if (e.data.command === 'stop') {
        isRunning = false;
    } else {
        generateOrder();
    }
};
`;

function startTrading() {
    if (isTrading) return;
    isTrading = true;
    
    // UI Update
    els.btnStartTrading.classList.add('hidden');
    els.btnStopTrading.classList.remove('hidden');
    if(isSABSupported) {
        els.engineBadge.classList.add('active');
        els.engineBadge.innerHTML = '<i class="fas fa-server"></i> Exchange Live (Lock-Free)';
    }
    
    // Clean state
    if (isSABSupported) allocateSharedMemory();
    orderBook = { bids: new Map(), asks: new Map() };
    metrics = { totalOrders: 0, totalTrades: 0, lastOrders: 0, opsPerSec: 0 };
    els.tradeTape.innerHTML = '';
    
    // Spawn Workers
    const blob = new Blob([workerBlobCode], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const numBots = parseInt(els.botCountSlider.value);
    
    for (let i = 0; i < numBots; i++) {
        const worker = new Worker(workerUrl);
        if (!isSABSupported) {
            worker.onmessage = (e) => processOrder(e.data.type, e.data.price, e.data.qty);
        }
        worker.postMessage({
            sab, isSABSupported, capacity: CONFIG.CAPACITY,
            headerSize: CONFIG.HEADER_SIZE, orderSize: CONFIG.ORDER_SIZE,
            startPrice: marketPrice
        });
        workers.push(worker);
    }
    
    // Start Engine Loop
    engineLoop();
    startMetricsTimer();
}

function stopTrading() {
    isTrading = false;
    workers.forEach(w => w.postMessage({ command: 'stop' }));
    setTimeout(() => {
        workers.forEach(w => w.terminate());
        workers = [];
    }, 100);
    
    clearTimeout(renderTimer);
    clearInterval(metricsTimer);
    
    els.btnStopTrading.classList.add('hidden');
    els.btnStartTrading.classList.remove('hidden');
    if(isSABSupported) {
        els.engineBadge.classList.remove('active');
        els.engineBadge.innerHTML = '<i class="fas fa-server"></i> Exchange Offline';
    }
}

// ==========================================
// 3. MATCHING ENGINE LOGIC (MAIN THREAD)
// ==========================================
function engineLoop() {
    if (!isTrading) return;

    if (isSABSupported) {
        // Drain Ring Buffer
        let readIdx = view[0];
        let processedThisFrame = 0;
        
        // Read batch to avoid freezing UI thread
        while (processedThisFrame < 2000) {
            let offsetIdx = CONFIG.HEADER_SIZE + (readIdx * CONFIG.ORDER_SIZE);
            
            // Check if order is ready
            if (Atomics.load(view, offsetIdx) === 1) {
                const type = view[offsetIdx + 1];
                const price = view[offsetIdx + 2];
                const qty = view[offsetIdx + 3];
                
                processOrder(type, price, qty);
                
                // Clear slot and advance
                Atomics.store(view, offsetIdx, 0);
                readIdx = (readIdx + 1) % CONFIG.CAPACITY;
                processedThisFrame++;
            } else {
                break; // Buffer caught up
            }
        }
        view[0] = readIdx; // Update global read pointer
    }

    // Sort Orderbook for UI Rendering
    sortedBids = Array.from(orderBook.bids.entries()).map(e => ({price: e[0], qty: e[1]})).sort((a,b) => b.price - a.price);
    sortedAsks = Array.from(orderBook.asks.entries()).map(e => ({price: e[0], qty: e[1]})).sort((a,b) => a.price - b.price);

    // Render UI (Throttled via requestAnimationFrame)
    renderMarketDepth();
    renderOrderBookUI();

    renderTimer = requestAnimationFrame(engineLoop);
}

function processOrder(incomingType, price, qty) {
    metrics.totalOrders++;
    let remainingQty = qty;

    if (incomingType === 0) { // BID (Buy)
        // Match against Asks (sorted Ascending)
        let asksArray = Array.from(orderBook.asks.entries()).sort((a,b) => a[0] - b[0]);
        
        for (let i = 0; i < asksArray.length && remainingQty > 0; i++) {
            let askPrice = asksArray[i][0];
            let askQty = asksArray[i][1];
            
            if (price >= askPrice) {
                // Trade executes!
                let tradeQty = Math.min(remainingQty, askQty);
                executeTrade('buy', askPrice, tradeQty);
                
                remainingQty -= tradeQty;
                let newAskQty = askQty - tradeQty;
                
                if (newAskQty === 0) orderBook.asks.delete(askPrice);
                else orderBook.asks.set(askPrice, newAskQty);
            } else {
                break; // No more matching asks
            }
        }
        
        // Add remainder to book
        if (remainingQty > 0) {
            let existing = orderBook.bids.get(price) || 0;
            orderBook.bids.set(price, existing + remainingQty);
        }
        
    } else { // ASK (Sell)
        // Match against Bids (sorted Descending)
        let bidsArray = Array.from(orderBook.bids.entries()).sort((a,b) => b[0] - a[0]);
        
        for (let i = 0; i < bidsArray.length && remainingQty > 0; i++) {
            let bidPrice = bidsArray[i][0];
            let bidQty = bidsArray[i][1];
            
            if (price <= bidPrice) {
                // Trade executes!
                let tradeQty = Math.min(remainingQty, bidQty);
                executeTrade('sell', bidPrice, tradeQty);
                
                remainingQty -= tradeQty;
                let newBidQty = bidQty - tradeQty;
                
                if (newBidQty === 0) orderBook.bids.delete(bidPrice);
                else orderBook.bids.set(bidPrice, newBidQty);
            } else {
                break; // No more matching bids
            }
        }
        
        // Add remainder to book
        if (remainingQty > 0) {
            let existing = orderBook.asks.get(price) || 0;
            orderBook.asks.set(price, existing + remainingQty);
        }
    }
}

function executeTrade(side, price, qty) {
    metrics.totalTrades++;
    marketPrice = price; // Update current market price

    // Update Tape UI (throttle DOM updates if too fast)
    if (Math.random() < 0.1) { // Only show 10% of trades visually to prevent DOM lag
        const row = document.createElement('div');
        row.className = `tape-trade ${side}`;
        const time = new Date().toISOString().split('T')[1].substring(0, 11);
        row.innerHTML = `
            <span class="size">${qty}</span>
            <span class="price">$${(price/100).toFixed(2)}</span>
            <span class="tape-time">${time}</span>
        `;
        els.tradeTape.prepend(row);
        if (els.tradeTape.children.length > 50) {
            els.tradeTape.lastChild.remove();
        }
    }
}

function startMetricsTimer() {
    metricsTimer = setInterval(() => {
        metrics.opsPerSec = metrics.totalOrders - metrics.lastOrders;
        metrics.lastOrders = metrics.totalOrders;
        
        els.statOrdersTotal.textContent = metrics.totalOrders.toLocaleString();
        els.statTradesTotal.textContent = metrics.totalTrades.toLocaleString();
        els.statOpsPerSec.textContent = `${metrics.opsPerSec.toLocaleString()} / sec`;
        
        // Calculate Spread
        if (sortedBids.length > 0 && sortedAsks.length > 0) {
            const spread = (sortedAsks[0].price - sortedBids[0].price) / 100;
            els.statSpread.textContent = `$${spread.toFixed(2)}`;
        }
    }, 1000);
}

// ==========================================
// 4. VISUALIZATION (CANVAS & DOM)
// ==========================================
function renderMarketDepth() {
    const w = els.canvas.clientWidth;
    const h = els.canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    
    if (sortedBids.length === 0 || sortedAsks.length === 0) return;

    // Determine X-axis scale (centered around market price)
    const priceRange = 200; // Look 200 cents ($2.00) in both directions
    const minPrice = marketPrice - priceRange;
    const maxPrice = marketPrice + priceRange;
    
    // Determine Y-axis scale (max cumulative volume)
    let maxVol = 10;
    let bVol = 0;
    sortedBids.forEach(b => { if(b.price >= minPrice) { bVol += b.qty; maxVol = Math.max(maxVol, bVol); } });
    let aVol = 0;
    sortedAsks.forEach(a => { if(a.price <= maxPrice) { aVol += a.qty; maxVol = Math.max(maxVol, aVol); } });

    // Draw Bids (Green, right to left accumulation)
    ctx.beginPath();
    ctx.moveTo(w/2, h);
    let cumulativeBid = 0;
    
    for (let i = 0; i < sortedBids.length; i++) {
        if (sortedBids[i].price < minPrice) break;
        cumulativeBid += sortedBids[i].qty;
        
        // Map price to X (left half)
        const normalizedX = (sortedBids[i].price - minPrice) / (marketPrice - minPrice);
        const x = normalizedX * (w / 2);
        const y = h - ((cumulativeBid / maxVol) * h * 0.9); // Leave 10% padding top
        
        ctx.lineTo(x, y);
    }
    ctx.lineTo(0, h);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Asks (Red, left to right accumulation)
    ctx.beginPath();
    ctx.moveTo(w/2, h);
    let cumulativeAsk = 0;
    
    for (let i = 0; i < sortedAsks.length; i++) {
        if (sortedAsks[i].price > maxPrice) break;
        cumulativeAsk += sortedAsks[i].qty;
        
        // Map price to X (right half)
        const normalizedX = (sortedAsks[i].price - marketPrice) / (maxPrice - marketPrice);
        const x = (w / 2) + (normalizedX * (w / 2));
        const y = h - ((cumulativeAsk / maxVol) * h * 0.9);
        
        ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.stroke();
    
    // Draw Center Line (Current Price)
    ctx.beginPath();
    ctx.moveTo(w/2, 0);
    ctx.lineTo(w/2, h);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
}

function renderOrderBookUI() {
    // Render top 15 asks (reverse order so lowest ask is at bottom)
    els.bookAsks.innerHTML = '';
    let maxBookVol = 1;
    
    const asksToShow = sortedAsks.slice(0, 15).reverse();
    const bidsToShow = sortedBids.slice(0, 15);
    
    // Find max vol for depth bars
    [...asksToShow, ...bidsToShow].forEach(o => maxBookVol = Math.max(maxBookVol, o.qty));

    asksToShow.forEach(ask => {
        const row = document.createElement('div');
        row.className = 'book-row';
        row.innerHTML = `
            <span class="size">${ask.qty}</span>
            <span class="price">${(ask.price/100).toFixed(2)}</span>
        `;
        const width = (ask.qty / maxBookVol) * 100;
        row.style.setProperty('--depth-width', `${width}%`);
        
        // Apply width to pseudo element
        const style = document.createElement('style');
        style.innerHTML = `
            .book-asks .book-row:nth-child(${els.bookAsks.children.length + 1})::before { width: ${width}%; }
        `;
        row.appendChild(style);
        
        els.bookAsks.appendChild(row);
    });

    // Update Spread
    if (sortedBids.length > 0 && sortedAsks.length > 0) {
        els.bookSpreadDisplay.innerHTML = `
            ${(sortedAsks[0].price / 100).toFixed(2)} 
            <span style="color:#64748b; margin:0 10px;">Spread: ${((sortedAsks[0].price - sortedBids[0].price)/100).toFixed(2)}</span> 
            ${(sortedBids[0].price / 100).toFixed(2)}
        `;
    }

    // Render top 15 bids
    els.bookBids.innerHTML = '';
    bidsToShow.forEach(bid => {
        const row = document.createElement('div');
        row.className = 'book-row';
        row.innerHTML = `
            <span class="size">${bid.qty}</span>
            <span class="price">${(bid.price/100).toFixed(2)}</span>
        `;
        const width = (bid.qty / maxBookVol) * 100;
        
        const style = document.createElement('style');
        style.innerHTML = `
            .book-bids .book-row:nth-child(${els.bookBids.children.length + 1})::before { width: ${width}%; }
        `;
        row.appendChild(style);
        
        els.bookBids.appendChild(row);
    });
}
