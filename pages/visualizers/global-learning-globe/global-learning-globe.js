// ==========================================================================
// GLOBAL LEARNING GLOBE - WebGL ENGINE & SCHEDULER
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initGlobeApp();
});

// Three.js Globals
let scene, camera, renderer, controls;
let earthMesh, gridMesh;
let activeAnimations = [];

// App States
let autoRotateEnabled = true;
let rotateSpeedSetting = 3; // range 1-10
let activeFilter = "all";
let totalXP = 1240;
let topicCounts = { trees: 15, graphs: 22, sorting: 18, dp: 28 };
let countryWeights = { India: 4, Germany: 2, Brazil: 2, USA: 5, Japan: 3, Australia: 2 };

// Geographic Database of Countries
const COUNTRIES_DB = {
  India: { name: "India", flag: "🇮🇳", lat: 20.5937, lon: 78.9629 },
  Germany: { name: "Germany", flag: "🇩🇪", lat: 51.1657, lon: 10.4515 },
  Brazil: { name: "Brazil", flag: "🇧🇷", lat: -14.2350, lon: -51.9253 },
  USA: { name: "United States", flag: "🇺🇸", lat: 37.0902, lon: -95.7129 },
  Japan: { name: "Japan", flag: "🇯🇵", lat: 36.2048, lon: 138.2529 },
  Australia: { name: "Australia", flag: "🇦🇺", lat: -25.2744, lon: 133.7751 },
  UK: { name: "United Kingdom", flag: "🇬🇧", lat: 55.3781, lon: -3.4360 },
  SouthAfrica: { name: "South Africa", flag: "🇿🇦", lat: -30.5595, lon: 22.9375 },
  Egypt: { name: "Egypt", flag: "🇪🇬", lat: 26.8206, lon: 30.8025 },
  Canada: { name: "Canada", flag: "🇨🇦", lat: 56.1304, lon: -106.3468 }
};

// Learning Topics
const TOPICS = [
  { id: "trees", name: "Invert Binary Tree", xp: 100, category: "trees", color: 0xfbbf24 },
  { id: "trees_bfs", name: "Level Order Traversal", xp: 80, category: "trees", color: 0xfbbf24 },
  { id: "graphs_dijkstra", name: "Dijkstra's Pathfinding", xp: 150, category: "graphs", color: 0x06b6d4 },
  { id: "graphs_dfs", name: "Cycle Detection", xp: 120, category: "graphs", color: 0x06b6d4 },
  { id: "sorting_quick", name: "Quick Sort Partition", xp: 90, category: "sorting", color: 0x10b981 },
  { id: "sorting_merge", name: "Merge Sort Splits", xp: 110, category: "sorting", color: 0x10b981 },
  { id: "dp_knapsack", name: "0/1 Knapsack Grid", xp: 130, category: "dp", color: 0x8b5cf6 },
  { id: "dp_lcs", name: "Edit Distance LCS", xp: 140, category: "dp", color: 0x8b5cf6 }
];

const CATEGORY_COLORS = {
  trees: "#fbbf24",    // Gold
  graphs: "#06b6d4",   // Cyan
  sorting: "#10b981",  // Emerald
  dp: "#8b5cf6"       // Purple
};

// ──────────────────────────────────────────────────────────────────────────
// 🛠️ APPLICATION INITIALIZER
// ──────────────────────────────────────────────────────────────────────────
function initGlobeApp() {
  // HTML Handles
  const btnSimulate = document.getElementById("btn-simulate-event");
  const chkRotate = document.getElementById("chk-auto-rotate");
  const sliderSpeed = document.getElementById("slider-rotate-speed");
  const filterBtns = document.querySelectorAll(".filter-btn");

  // WebGL Setup
  initWebGL();

  // Settings Bindings
  chkRotate.addEventListener("change", () => {
    autoRotateEnabled = chkRotate.checked;
  });

  sliderSpeed.addEventListener("input", () => {
    rotateSpeedSetting = parseInt(sliderSpeed.value);
  });

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.getAttribute("data-filter");
      filterFeedItems();
    });
  });

  // Simulate Button
  btnSimulate.addEventListener("click", () => {
    triggerMockActivity();
  });

  // Initial Stats fill
  updateStatsDisplay();

  // Populate initial scrolling feed history
  for (let i = 0; i < 5; i++) {
    createMockHistoryItem();
  }

  // Start Real-Time Simulation Interval
  startActivitySimulator();

  // Hide loading screen
  const loader = document.getElementById("loading-screen");
  if (loader) loader.classList.add("hidden");
}

// ──────────────────────────────────────────────────────────────────────────
// 🌐 WebGL & THREEJS INITIALIZATION
// ──────────────────────────────────────────────────────────────────────────
function initWebGL() {
  const container = document.getElementById("canvas3d-container");
  if (!container) return;

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 11);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // OrbitControls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 6;
  controls.maxDistance = 20;

  // Create holographic digital globe grid sphere
  const innerRadius = 4;
  
  // 1. Earth mesh with procedural continents
  const earthGeom = new THREE.SphereGeometry(innerRadius, 64, 64);
  const earthTexture = createProceduralEarthTexture();
  const earthMat = new THREE.MeshBasicMaterial({
    map: earthTexture,
    transparent: true,
    opacity: 0.95
  });
  earthMesh = new THREE.Mesh(earthGeom, earthMat);
  scene.add(earthMesh);

  // 2. Outer Wireframe holographic net sphere
  const gridGeom = new THREE.SphereGeometry(innerRadius + 0.06, 24, 24);
  const gridMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4, // Cyan
    wireframe: true,
    transparent: true,
    opacity: 0.15
  });
  gridMesh = new THREE.Mesh(gridGeom, gridMat);
  scene.add(gridMesh);

  // Lighting (Optional, meshbasic doesn't need lights, keeping it clean and compatible)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  // Resize handler
  window.addEventListener("resize", onWindowResize);

  // Start rendering loop
  animate();
}

function onWindowResize() {
  const container = document.getElementById("canvas3d-container");
  if (!container || !renderer) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

// ──────────────────────────────────────────────────────────────────────────
// 🎨 PROCEDURAL EARTH TEXTURE CANVAS GENERATOR
// ──────────────────────────────────────────────────────────────────────────
function createProceduralEarthTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  // Oceans (dark space-blue base)
  ctx.fillStyle = "#0c0c16";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Simplified continent polygons (flat mapping projection coordinate approximations)
  ctx.fillStyle = "#161626";
  ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
  ctx.lineWidth = 2.5;

  const continents = [
    // North America approximation
    [[120, 80], [280, 80], [360, 160], [330, 240], [210, 210], [170, 130]],
    // South America
    [[240, 245], [320, 270], [290, 420], [240, 310]],
    // Eurasia / Africa / India
    [[450, 80], [780, 80], [890, 130], [920, 240], [810, 300], [700, 410], [610, 430], [520, 360], [450, 240], [410, 150]],
    // India sub-region detail
    [[640, 210], [680, 210], [670, 260], [640, 240]],
    // Australia
    [[820, 320], [920, 320], [900, 400], [820, 400]],
    // Greenland
    [[330, 30], [390, 30], [380, 70], [340, 70]]
  ];

  continents.forEach(poly => {
    ctx.beginPath();
    ctx.moveTo(poly[0][0], poly[0][1]);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i][0], poly[i][1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // Dotted Latitude & Longitude lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 12]);
  for (let i = 1; i < 8; i++) {
    // horizontal
    ctx.beginPath();
    ctx.moveTo(0, (canvas.height / 8) * i);
    ctx.lineTo(canvas.width, (canvas.height / 8) * i);
    ctx.stroke();
    // vertical
    ctx.beginPath();
    ctx.moveTo((canvas.width / 8) * i, 0);
    ctx.lineTo((canvas.width / 8) * i, canvas.height);
    ctx.stroke();
  }

  // Draw country dots as glowing coordinates on texture directly (visual helper)
  ctx.setLineDash([]);
  Object.values(COUNTRIES_DB).forEach(c => {
    // Mercator approx for map alignment
    const x = ((c.lon + 180) / 360) * canvas.width;
    const y = ((90 - c.lat) / 180) * canvas.height;

    // Glowing coordinate base
    const grad = ctx.createRadialGradient(x, y, 1, x, y, 6);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.5, "rgba(6, 182, 212, 0.5)");
    grad.addColorStop(1, "rgba(6, 182, 212, 0)");
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  return new THREE.CanvasTexture(canvas);
}

// Convert Geographical Lat/Lon into 3D Cartesian Vector coordinates
function latLonToVector3(lat, lon, r) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(r * Math.sin(phi) * Math.sin(theta));
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.cos(theta);
  return new THREE.Vector3(x, y, z);
}

// ──────────────────────────────────────────────────────────────────────────
// 🌟 3D SIGNAL GENERATION (BEAMS & PULSING RINGS)
// ──────────────────────────────────────────────────────────────────────────
function spawn3DPulse(country, topic) {
  const r = 4;
  const startVec = latLonToVector3(country.lat, country.lon, r);
  const color = topic.color;

  // 1. Spawning Vertical Beam
  const beamHeight = 1.0;
  const endVec = latLonToVector3(country.lat, country.lon, r + beamHeight);
  
  const points = [startVec, endVec];
  const beamGeom = new THREE.BufferGeometry().setFromPoints(points);
  
  // Custom glowing line shader approximation
  const beamMat = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 1.0
  });
  
  const beam = new THREE.Line(beamGeom, beamMat);
  scene.add(beam);

  // 2. Spawning Pulsing Ring on Surface
  const ringGeom = new THREE.RingGeometry(0.02, 0.12, 16);
  const ringMat = new THREE.MeshBasicMaterial({
    color: color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8
  });
  const ring = new THREE.Mesh(ringGeom, ringMat);
  ring.position.copy(startVec);
  
  // Orient ring perpendicular to earth sphere surface at startVec
  const targetLook = startVec.clone().multiplyScalar(2);
  ring.lookAt(targetLook);
  scene.add(ring);

  // 3. Spawning Quadratic Bezier Arc to adjacent node
  const adjacentKeys = Object.keys(COUNTRIES_DB).filter(k => COUNTRIES_DB[k].name !== country.name);
  const randDestKey = adjacentKeys[Math.floor(Math.random() * adjacentKeys.length)];
  const destCountry = COUNTRIES_DB[randDestKey];
  const destVec = latLonToVector3(destCountry.lat, destCountry.lon, r);

  const arcPoints = [];
  // Midpoint control vector arched upwards
  const midVec = new THREE.Vector3().addVectors(startVec, destVec).multiplyScalar(0.5);
  midVec.normalize().multiplyScalar(r + 1.2); // Elevate arc

  const curve = new THREE.QuadraticBezierCurve3(startVec, midVec, destVec);
  const curvePoints = curve.getPoints(24);
  const arcGeom = new THREE.BufferGeometry().setFromPoints(curvePoints);
  
  const arcMat = new THREE.LineBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.0 // starts hidden, fades in and out
  });
  const arc = new THREE.Line(arcGeom, arcMat);
  scene.add(arc);

  // Push to animations queue
  activeAnimations.push({
    beam: beam,
    ring: ring,
    arc: arc,
    maxAge: 80, // frames
    age: 0,
    update: function() {
      this.age++;
      const ratio = this.age / this.maxAge;
      
      // Beam fades out
      this.beam.material.opacity = 1.0 - ratio;
      
      // Ring expands and fades out
      const ringScale = 1.0 + ratio * 4.0;
      this.ring.scale.set(ringScale, ringScale, 1);
      this.ring.material.opacity = 0.8 * (1.0 - ratio);

      // Arc rises (fades in then out)
      if (ratio < 0.5) {
        this.arc.material.opacity = ratio * 2;
      } else {
        this.arc.material.opacity = 2 * (1.0 - ratio);
      }
    },
    destroy: function() {
      scene.remove(this.beam);
      scene.remove(this.ring);
      scene.remove(this.arc);
      this.beam.geometry.dispose();
      this.beam.material.dispose();
      this.ring.geometry.dispose();
      this.ring.material.dispose();
      this.arc.geometry.dispose();
      this.arc.material.dispose();
    }
  });

  // Smooth camera pan: slightly nudge camera towards active coordinates
  if (autoRotateEnabled) {
    nudgeCameraTowards(startVec);
  }
}

function nudgeCameraTowards(targetVec) {
  // Let's interpolate controls target towards a node (gently)
  // To avoid jarring jumps, we do a single gentle step
  const currentPos = camera.position.clone();
  const dir = targetVec.clone().normalize().multiplyScalar(currentPos.length());
  
  // Lerp camera towards target direction slightly
  camera.position.lerp(dir, 0.05);
}

// ──────────────────────────────────────────────────────────────────────────
// 🔁 THREEJS RENDER LOOP
// ──────────────────────────────────────────────────────────────────────────
function animate() {
  requestAnimationFrame(animate);

  // Rotate globe when auto-rotate is enabled
  if (autoRotateEnabled && earthMesh && gridMesh) {
    const deltaSpeed = rotateSpeedSetting * 0.001;
    earthMesh.rotation.y += deltaSpeed;
    gridMesh.rotation.y += deltaSpeed;
  }

  // Update signal animations
  for (let i = activeAnimations.length - 1; i >= 0; i--) {
    const anim = activeAnimations[i];
    anim.update();
    if (anim.age >= anim.maxAge) {
      anim.destroy();
      activeAnimations.splice(i, 1);
    }
  }

  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

// ──────────────────────────────────────────────────────────────────────────
// 📈 DYNAMIC STATS PANEL UPDATE
// ──────────────────────────────────────────────────────────────────────────
function updateStatsDisplay() {
  document.getElementById("stat-total-xp").textContent = `${totalXP.toLocaleString()} XP`;

  // Find top topic category
  let maxCount = -1;
  let topTopicKey = "DP";
  Object.entries(topicCounts).forEach(([key, val]) => {
    if (val > maxCount) {
      maxCount = val;
      if (key === "trees") topTopicKey = "Trees & Recursion";
      else if (key === "graphs") topTopicKey = "Graphs & BFS/DFS";
      else if (key === "sorting") topTopicKey = "Sorting Visuals";
      else if (key === "dp") topTopicKey = "Dynamic Prog.";
    }
  });
  document.getElementById("stat-top-topic").textContent = topTopicKey;

  // Find top active country
  let topCountry = "India (🇮🇳)";
  let maxWeight = -1;
  Object.entries(countryWeights).forEach(([key, val]) => {
    if (val > maxWeight) {
      maxWeight = val;
      const c = Object.values(COUNTRIES_DB).find(c => c.name === key || c.id === key);
      if (c) topCountry = `${c.name} (${c.flag})`;
    }
  });
  document.getElementById("stat-active-nodes").textContent = topCountry;
}

// ──────────────────────────────────────────────────────────────────────────
// 📰 PULSE FEED MANAGEMENT
// ──────────────────────────────────────────────────────────────────────────
function addFeedItem(country, topic) {
  const container = document.getElementById("feed-scroller");
  const placeholder = document.getElementById("empty-feed-placeholder");
  
  if (placeholder) placeholder.classList.add("hidden");

  // Create feed card HTML
  const card = document.createElement("div");
  card.className = `feed-item feed-${topic.category}`;
  card.setAttribute("data-category", topic.category);

  card.innerHTML = `
    <div class="feed-item-top">
      <span class="feed-country">${country.flag} ${country.name}</span>
      <span class="feed-time">Just now</span>
    </div>
    <div class="feed-desc">Practicing <strong style="color: ${CATEGORY_COLORS[topic.category]}">${topic.name}</strong></div>
    <div class="feed-xp">+${topic.xp} XP</div>
  `;

  // Prepend to feed
  container.insertBefore(card, container.firstChild);

  // Apply visual category filtering immediately to new item
  if (activeFilter !== "all" && topic.category !== activeFilter) {
    card.classList.add("hidden");
  }

  // Restrict to max 25 feed cards to prevent memory bloat
  const items = container.querySelectorAll(".feed-item");
  if (items.length > 25) {
    container.removeChild(items[items.length - 1]);
  }

  // Update timestamps of older items
  updateFeedTimestamps(items);
}

function updateFeedTimestamps(items) {
  items.forEach((item, index) => {
    if (index === 0) return; // "Just now" for new item
    const timeSpan = item.querySelector(".feed-time");
    if (timeSpan) {
      // Simulate aging timestamps
      const seconds = index * 4 + Math.floor(Math.random() * 3);
      if (seconds < 60) {
        timeSpan.textContent = `${seconds}s ago`;
      } else {
        timeSpan.textContent = `1m ago`;
      }
    }
  });
}

function filterFeedItems() {
  const items = document.querySelectorAll(".feed-item");
  let matchCount = 0;

  items.forEach(item => {
    const cat = item.getAttribute("data-category");
    if (activeFilter === "all" || cat === activeFilter) {
      item.classList.remove("hidden");
      matchCount++;
    } else {
      item.classList.add("hidden");
    }
  });

  const placeholder = document.getElementById("empty-feed-placeholder");
  if (placeholder) {
    placeholder.classList.toggle("hidden", matchCount > 0);
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 🎲 SIMULATION ENGINE
// ──────────────────────────────────────────────────────────────────────────
function createMockHistoryItem() {
  const keys = Object.keys(COUNTRIES_DB);
  const randCountry = COUNTRIES_DB[keys[Math.floor(Math.random() * keys.length)]];
  const randTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  addFeedItem(randCountry, randTopic);
}

function triggerMockActivity() {
  const keys = Object.keys(COUNTRIES_DB);
  const randCountry = COUNTRIES_DB[keys[Math.floor(Math.random() * keys.length)]];
  
  // Find a topic matching active filter if possible, otherwise random
  let matchedTopics = TOPICS;
  if (activeFilter !== "all") {
    matchedTopics = TOPICS.filter(t => t.category === activeFilter);
  }
  
  const randTopic = matchedTopics[Math.floor(Math.random() * matchedTopics.length)];

  // Update cumulative variables
  totalXP += randTopic.xp;
  topicCounts[randTopic.category]++;
  countryWeights[randCountry.name] = (countryWeights[randCountry.name] || 0) + 1;

  // Render HTML list card
  addFeedItem(randCountry, randTopic);

  // Render 3D WebGL particle/pulse
  spawn3DPulse(randCountry, randTopic);

  // Update HUD
  updateStatsDisplay();
}

function startActivitySimulator() {
  function loop() {
    // Random delay between 2 and 4.5 seconds
    const delay = 2000 + Math.random() * 2500;
    setTimeout(() => {
      // Trigger simulation
      triggerMockActivity();
      loop();
    }, delay);
  }
  loop();
}
