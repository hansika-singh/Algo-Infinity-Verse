// Service Configuration
const SERVICES = [
    { id: 'api-gateway', name: 'API Gateway', icon: '🚪', status: 'healthy', latency: 50 },
    { id: 'auth', name: 'Authentication', icon: '🔐', status: 'healthy', latency: 45 },
    { id: 'user', name: 'User Service', icon: '👤', status: 'healthy', latency: 40 },
    { id: 'payment', name: 'Payment Service', icon: '💰', status: 'healthy', latency: 80 },
    { id: 'notification', name: 'Notification', icon: '🔔', status: 'healthy', latency: 30 },
    { id: 'inventory', name: 'Inventory Service', icon: '📦', status: 'healthy', latency: 60 },
];

// Connections between services
const CONNECTIONS = [
    { from: 'api-gateway', to: 'auth' },
    { from: 'api-gateway', to: 'user' },
    { from: 'api-gateway', to: 'payment' },
    { from: 'api-gateway', to: 'notification' },
    { from: 'api-gateway', to: 'inventory' },
    { from: 'payment', to: 'notification' },
];

let services = [];
let errorLog = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    services = JSON.parse(JSON.stringify(SERVICES));
    renderServices();
    renderGraph();
    updateStats();
    startHealthSimulation();
});

// Render service cards
function renderServices() {
    const grid = document.getElementById('serviceGrid');
    grid.innerHTML = services.map(service => `
        <div class="service-card ${service.status} fade-in">
            <span class="service-icon">${service.icon}</span>
            <div class="service-name">${service.name}</div>
            <div class="service-status status-${service.status}">
                ● ${service.status}
            </div>
            <div class="service-latency">⏱️ ${service.latency}ms</div>
        </div>
    `).join('');
}

// Render SVG graph
function renderGraph() {
    const svg = document.getElementById('serviceGraph');
    const width = svg.clientWidth || 800;
    const height = svg.clientHeight || 500;
    
    // Clear previous
    svg.innerHTML = '';
    
    // Calculate positions (circular layout)
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2.5;
    
    // Draw connections first (so they're behind nodes)
    const connectionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    CONNECTIONS.forEach(conn => {
        const fromIdx = services.findIndex(s => s.id === conn.from);
        const toIdx = services.findIndex(s => s.id === conn.to);
        
        if (fromIdx === -1 || toIdx === -1) return;
        
        const angle1 = (fromIdx / services.length) * 2 * Math.PI - Math.PI / 2;
        const angle2 = (toIdx / services.length) * 2 * Math.PI - Math.PI / 2;
        
        const x1 = centerX + radius * Math.cos(angle1);
        const y1 = centerY + radius * Math.sin(angle1);
        const x2 = centerX + radius * Math.cos(angle2);
        const y2 = centerY + radius * Math.sin(angle2);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', '#999');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '5,5');
        
        // Animate connection
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
        animate.setAttribute('attributeName', 'stroke-dashoffset');
        animate.setAttribute('from', '0');
        animate.setAttribute('to', '20');
        animate.setAttribute('dur', '2s');
        animate.setAttribute('repeatCount', 'indefinite');
        line.appendChild(animate);
        
        connectionGroup.appendChild(line);
    });
    
    svg.appendChild(connectionGroup);
    
    // Draw nodes
    services.forEach((service, index) => {
        const angle = (index / services.length) * 2 * Math.PI - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        // Circle with status color
        const colors = {
            healthy: '#4CAF50',
            degraded: '#FF9800',
            unhealthy: '#f44336'
        };
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '30');
        circle.setAttribute('fill', colors[service.status] || '#9E9E9E');
        circle.setAttribute('stroke', '#333');
        circle.setAttribute('stroke-width', '2');
        circle.setAttribute('class', 'service-node');
        circle.onclick = () => showServiceDetails(service.id);
        
        // Pulsing animation for unhealthy
        if (service.status === 'unhealthy') {
            const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'animate');
            pulse.setAttribute('attributeName', 'r');
            pulse.setAttribute('values', '30;35;30');
            pulse.setAttribute('dur', '1s');
            pulse.setAttribute('repeatCount', 'indefinite');
            circle.appendChild(pulse);
        }
        
        svg.appendChild(circle);
        
        // Service icon
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '20');
        text.textContent = service.icon;
        svg.appendChild(text);
        
        // Service name
        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('x', x);
        nameText.setAttribute('y', y + 55);
        nameText.setAttribute('text-anchor', 'middle');
        nameText.setAttribute('font-size', '11');
        nameText.setAttribute('fill', '#333');
        nameText.textContent = service.name;
        svg.appendChild(nameText);
        
        // Latency
        const latencyText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        latencyText.setAttribute('x', x);
        latencyText.setAttribute('y', y + 70);
        latencyText.setAttribute('text-anchor', 'middle');
        latencyText.setAttribute('font-size', '9');
        latencyText.setAttribute('fill', '#666');
        latencyText.textContent = `${service.latency}ms`;
        svg.appendChild(latencyText);
    });
}

// Update statistics
function updateStats() {
    const total = services.length;
    const healthy = services.filter(s => s.status === 'healthy').length;
    const degraded = services.filter(s => s.status === 'degraded').length;
    const unhealthy = services.filter(s => s.status === 'unhealthy').length;
    
    document.getElementById('totalServices').textContent = total;
    document.getElementById('healthyServices').textContent = healthy;
    document.getElementById('degradedServices').textContent = degraded;
    document.getElementById('unhealthyServices').textContent = unhealthy;
}

// Health simulation
function startHealthSimulation() {
    setInterval(() => {
        services = services.map(service => {
            // Random health changes (10% chance)
            if (Math.random() > 0.9) {
                const statuses = ['healthy', 'degraded', 'unhealthy'];
                const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
                
                // Log if status changes to unhealthy
                if (newStatus === 'unhealthy' && service.status !== 'unhealthy') {
                    addErrorLog(`${service.name} became unhealthy!`);
                }
                
                return {
                    ...service,
                    status: newStatus,
                    latency: Math.floor(Math.random() * 100) + 10
                };
            }
            return service;
        });
        
        renderServices();
        renderGraph();
        updateStats();
    }, 5000);
}

// Add error to log
function addErrorLog(message) {
    const time = new Date().toLocaleTimeString();
    errorLog.unshift({ message, time, resolved: false });
    
    if (errorLog.length > 20) errorLog.pop();
    renderErrorLog();
}

// Render error log
function renderErrorLog() {
    const container = document.getElementById('errorMessages');
    container.innerHTML = errorLog.map((error, index) => `
        <div class="error-entry ${error.resolved ? 'resolved' : ''}">
            <span>${error.resolved ? '✅' : '❌'} ${error.message}</span>
            <span class="error-time">${error.time}</span>
            ${!error.resolved ? `<button onclick="resolveError(${index})">✅ Resolve</button>` : ''}
        </div>
    `).join('');
}

// Resolve error
function resolveError(index) {
    errorLog[index].resolved = true;
    renderErrorLog();
}

// Show service details
function showServiceDetails(serviceId) {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    alert(`📊 ${service.name}
    Status: ${service.status}
    Latency: ${service.latency}ms
    ID: ${service.id}`);
}

// Controls
function refreshServices() {
    services = JSON.parse(JSON.stringify(SERVICES));
    errorLog = [];
    renderServices();
    renderGraph();
    updateStats();
    document.getElementById('errorMessages').innerHTML = '';
}

function simulateFailure() {
    // Pick a random service and make it unhealthy
    const randomIndex = Math.floor(Math.random() * services.length);
    services[randomIndex].status = 'unhealthy';
    services[randomIndex].latency = Math.floor(Math.random() * 500) + 200;
    
    addErrorLog(`${services[randomIndex].name} failed!`);
    renderServices();
    renderGraph();
    updateStats();
}

function scaleServices() {
    services = services.map(service => ({
        ...service,
        latency: Math.max(10, service.latency - Math.floor(Math.random() * 20))
    }));
    
    addErrorLog('📈 Services scaled! Latency reduced.');
    renderServices();
    renderGraph();
    updateStats();
}

function resetServices() {
    services = JSON.parse(JSON.stringify(SERVICES));
    errorLog = [];
    renderServices();
    renderGraph();
    updateStats();
    document.getElementById('errorMessages').innerHTML = '';
    addErrorLog('🔄 All services reset to healthy');
}

// Make functions global for HTML onclick
window.refreshServices = refreshServices;
window.simulateFailure = simulateFailure;
window.scaleServices = scaleServices;
window.resetServices = resetServices;
window.resolveError = resolveError;
window.showServiceDetails = showServiceDetails;