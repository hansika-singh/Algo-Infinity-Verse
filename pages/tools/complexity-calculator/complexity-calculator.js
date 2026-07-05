document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try { initComplexityCalculator(); } catch(e) { console.error("Complexity Calculator Error:", e); }
});

function initLoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById("loading-screen");
    if (s) s.classList.add("hidden");
  }, 1000);
}

function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 400));
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  if (!menuToggle || !navLinks) return;
  let overlay = document.querySelector(".nav-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    document.body.appendChild(overlay);
  }
  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains("active");
    navLinks.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
    overlay.classList.toggle("active", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
    const icon = menuToggle.querySelector("i");
    if (icon) { icon.classList.toggle("fa-bars", !isOpen); icon.classList.toggle("fa-times", isOpen); }
  };
  menuToggle.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  overlay.addEventListener("click", () => toggleMenu(false));
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));
  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
  document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
    const parent = toggle.closest(".has-dropdown");
    const menu = parent?.querySelector(".dropdown-menu");
    if (!parent || !menu) return;
    let t;
    parent.addEventListener("mouseenter", () => { if (!isMobile()) { clearTimeout(t); parent.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); } });
    parent.addEventListener("mouseleave", () => { if (!isMobile()) { t = setTimeout(() => { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }, 250); } });
    toggle.addEventListener("click", (e) => { if (isMobile()) { e.preventDefault(); e.stopPropagation(); const o = parent.classList.toggle("open"); toggle.setAttribute("aria-expanded", o); } });
  });
  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".navbar");
    if (nav) nav.style.background = window.scrollY > 100 ? "rgba(10,10,26,0.95)" : "rgba(10,10,26,0.85)";
  });
}

/* --- Complexity Calculator Core Logic --- */
function initComplexityCalculator() {
  const ctx = document.getElementById("complexityChart").getContext("2d");
  const nSlider = document.getElementById("nSlider");
  const nValDisplay = document.getElementById("nValDisplay");
  const compareStats = document.getElementById("compareStats");
  const algoA = document.getElementById("algoA");
  const algoB = document.getElementById("algoB");

  const toggles = {
    "o1": document.getElementById("chk_o1"),
    "ologn": document.getElementById("chk_ologn"),
    "on": document.getElementById("chk_on"),
    "onlogn": document.getElementById("chk_onlogn"),
    "on2": document.getElementById("chk_on2"),
    "o2n": document.getElementById("chk_o2n"),
    "onfact": document.getElementById("chk_onfact"),
  };

  const algos = {
    binary_search: { name: "Binary Search", complex: "ologn", fn: (n) => Math.log2(n) },
    linear_search: { name: "Linear Search", complex: "on", fn: (n) => n },
    bubble_sort:   { name: "Bubble Sort", complex: "on2", fn: (n) => n * n },
    merge_sort:    { name: "Merge Sort", complex: "onlogn", fn: (n) => n * Math.log2(n) },
    fib_recursive: { name: "Fibonacci (Recursive)", complex: "o2n", fn: (n) => Math.pow(2, n) }
  };

  const colors = {
    "o1": "#4ade80",
    "ologn": "#3b82f6",
    "on": "#facc15",
    "onlogn": "#f97316",
    "on2": "#ef4444",
    "o2n": "#d946ef",
    "onfact": "#9333ea"
  };

  // Helper for factorial
  function fact(n) {
    if (n < 0 || !Number.isInteger(n)) return 0;
    if (n > 170) return Infinity; // max safe float limit
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  let chart;
  function updateChart() {
    const maxN = parseInt(nSlider.value, 10);
    nValDisplay.textContent = maxN;
    nSlider.setAttribute("aria-valuenow", maxN);

    const labels = [];
    for (let i = 1; i <= maxN; i++) labels.push(i);

    const datasets = [];

    // O(1)
    if (toggles.o1.checked) {
      datasets.push({
        label: 'O(1)',
        data: labels.map(() => 1),
        borderColor: colors.o1,
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 0
      });
    }

    // O(log n)
    if (toggles.ologn.checked) {
      datasets.push({
        label: 'O(log N)',
        data: labels.map(n => Math.log2(n)),
        borderColor: colors.ologn,
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 0
      });
    }

    // O(n)
    if (toggles.on.checked) {
      datasets.push({
        label: 'O(N)',
        data: labels.map(n => n),
        borderColor: colors.on,
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 0
      });
    }

    // O(n log n)
    if (toggles.onlogn.checked) {
      datasets.push({
        label: 'O(N log N)',
        data: labels.map(n => n * Math.log2(n)),
        borderColor: colors.onlogn,
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 0
      });
    }

    // O(n^2)
    if (toggles.on2.checked) {
      datasets.push({
        label: 'O(N²)',
        data: labels.map(n => n * n),
        borderColor: colors.on2,
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 0
      });
    }

    // O(2^n)
    if (toggles.o2n.checked) {
      datasets.push({
        label: 'O(2^N)',
        data: labels.map(n => Math.min(Math.pow(2, n), maxN * maxN * 2)), // Cap to prevent massive blowup
        borderColor: colors.o2n,
        borderWidth: 3,
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0
      });
    }

    // O(n!)
    if (toggles.onfact.checked) {
      datasets.push({
        label: 'O(N!)',
        data: labels.map(n => Math.min(fact(n), maxN * maxN * 2)), // Cap visual
        borderColor: colors.onfact,
        borderWidth: 3,
        borderDash: [2, 4],
        tension: 0.4,
        pointRadius: 0
      });
    }

    // Check highlighted algorithms
    const selA = algos[algoA.value];
    const selB = algos[algoB.value];

    datasets.forEach(ds => {
      // Dim non-selected if comparison is active, or highlight selected
      const isSelA = ds.label.includes(selA.complex.replace('o', '').toUpperCase());
      const isSelB = ds.label.includes(selB.complex.replace('o', '').toUpperCase());
      
      // Simple string matching isn't perfect, let's map directly
      const map = {
        "o1": "O(1)", "ologn": "O(log N)", "on": "O(N)", "onlogn": "O(N log N)",
        "on2": "O(N²)", "o2n": "O(2^N)", "onfact": "O(N!)"
      };

      if (ds.label === map[selA.complex] || ds.label === map[selB.complex]) {
        ds.borderWidth = 5; // Highlight
      } else {
        ds.borderWidth = 2; // Dim others
        ds.borderColor = ds.borderColor + '66'; // add transparency
      }
    });

    if (chart) {
      chart.data.labels = labels;
      chart.data.datasets = datasets;
      
      // dynamically scale Y axis max to fit O(N^2) gracefully based on N
      let maxY = maxN * 2;
      if (toggles.on2.checked || toggles.onlogn.checked) maxY = maxN * maxN;
      chart.options.scales.y.max = maxY;
      
      chart.update();
    } else {
      chart = new Chart(ctx, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 400 },
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { labels: { color: '#a0a0c0', font: { family: 'Fira Code' } } },
            tooltip: {
              backgroundColor: 'rgba(10, 10, 26, 0.9)',
              titleColor: '#fff',
              bodyFont: { family: 'Fira Code' },
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#a0a0c0' },
              title: { display: true, text: 'Input Size (N)', color: '#fff' }
            },
            y: {
              max: maxN * maxN,
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#a0a0c0' },
              title: { display: true, text: 'Operations (Estimated)', color: '#fff' }
            }
          }
        }
      });
    }

    updateStats(maxN, selA, selB);
  }

  function updateStats(n, a, b) {
    const valA = a.fn(n);
    const valB = b.fn(n);
    
    const format = (v) => {
      if (v > 1e6) return (v / 1e6).toFixed(2) + "M";
      if (v > 1e3) return (v / 1e3).toFixed(1) + "k";
      return Math.round(v);
    };

    let conclusion = "";
    if (valA < valB) conclusion = `<br><span style="color:var(--accent); margin-top:8px;">★ ${a.name} is faster for N=${n}.</span>`;
    else if (valB < valA) conclusion = `<br><span style="color:var(--accent); margin-top:8px;">★ ${b.name} is faster for N=${n}.</span>`;
    else conclusion = `<br><span style="color:#a0a0c0; margin-top:8px;">They perform identically at N=${n}.</span>`;

    compareStats.innerHTML = `
      <span><span class="cc-stat-highlight">${a.name}</span>: ~${format(valA)} ops</span>
      <span><span class="cc-stat-highlight">${b.name}</span>: ~${format(valB)} ops</span>
      ${conclusion}
    `;
  }

  // Listeners
  nSlider.addEventListener("input", updateChart);
  Object.values(toggles).forEach(chk => {
    chk.addEventListener("change", () => {
      const label = chk.closest('label');
      if (label) label.setAttribute('aria-checked', chk.checked);
      updateChart();
    });
    const label = chk.closest('label');
    if (label) {
      label.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          chk.checked = !chk.checked;
          chk.dispatchEvent(new Event("change"));
        }
      });
    }
  });
  algoA.addEventListener("change", updateChart);
  algoB.addEventListener("change", updateChart);

  // Init
  updateChart();
}
