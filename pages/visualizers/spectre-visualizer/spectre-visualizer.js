document.addEventListener('DOMContentLoaded', function() {
  svInit();
});

let SV_NS = 'http://www.w3.org/2000/svg';

/* ─── State ─── */
let svState = {
  currentStage : 0,
  mitigation   : false,
  stage0Step   : -1,
  stage0Playing: false,
  stage0Timer  : null,
  trainCount   : 0,
  oobStep      : -1,
  secretByte   : 65,
  cacheHotLine : -1,
};

/* ─── Stage navigation ─── */
function svGotoStage(n) {
  // Stop any playing animation
  if (svState.stage0Timer) { clearTimeout(svState.stage0Timer); svState.stage0Timer = null; }
  svState.stage0Playing = false;

  document.querySelectorAll('.sv-stage-btn').forEach(function(btn, i) {
    btn.classList.toggle('active', i === n);
  });
  document.querySelectorAll('.sv-stage-panel').forEach(function(panel, i) {
    panel.classList.toggle('active', i === n);
  });
  document.querySelectorAll('.sv-dot').forEach(function(dot, i) {
    dot.classList.toggle('active', i === n);
  });

  svState.currentStage = n;

  let prevBtn = document.getElementById('svPrevStage');
  let nextBtn = document.getElementById('svNextStage');
  if (prevBtn) prevBtn.disabled = n === 0;
  if (nextBtn) nextBtn.disabled = n === 3;

  // Show mitigation bar on stages 2-3
  let mitBar = document.getElementById('svMitigationBar');
  if (mitBar) mitBar.style.display = n >= 2 ? '' : 'none';

  // Draw initial canvas for current stage
  if (n === 0) svDrawStage0(-1);
  if (n === 1) svDrawStage1FSM(0);
  if (n === 2) svDrawStage2(-1);
  if (n === 3) { svDrawStage3Empty(); }
}

/* ─── Stage 0: Speculative Execution animation ─── */
let SV_S0_STEPS = [
  { label: 'FETCH branch instruction from memory', reg: 'PC = 0x1004', cache: '(unchanged)', stepId: 0 },
  { label: 'PREDICT: branch predictor says → Taken', reg: 'Spec exec: array1[x] loading...', cache: 'array1[x] → cache line loaded speculatively', stepId: 1 },
  { label: 'EXECUTE: speculative read completes', reg: 'spec_val = 0x41 (secret!)', cache: 'array2[0x41 × 512] loaded into cache', stepId: 2 },
  { label: 'RESOLVE: bounds check fails → ROLLBACK', reg: 'Registers cleared to pre-speculation state', cache: 'cache line REMAINS — microarch state not rolled back', stepId: 3 },
];

function svDrawStage0(stepIdx) {
  let canvas = document.getElementById('svCanvas0');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth || 500;
  canvas.height = 220;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let W = canvas.width; let H = canvas.height;
  let stages = ['Fetch', 'Decode', 'Execute', 'Memory', 'Writeback'];
  let stageW = W / (stages.length + 1);

  // Pipeline stages
  stages.forEach(function(name, i) {
    let x = stageW * (i + 0.5);
    let isActive = stepIdx >= 0 && stepIdx <= i && stepIdx <= 2;
    let isDone = stepIdx > i + 1;
    let isRollback = stepIdx === 3 && i > 0;

    ctx.fillStyle = isRollback ? 'rgba(239,68,68,0.25)' :
                    isActive   ? 'rgba(249,115,22,0.25)' :
                    isDone     ? 'rgba(34,197,94,0.2)' :
                    'rgba(255,255,255,0.04)';
    ctx.strokeStyle = isRollback ? '#ef4444' : isActive ? '#f97316' : isDone ? '#22c55e' : 'rgba(148,163,184,0.2)';
    ctx.lineWidth = isActive || isRollback ? 2.5 : 1.5;

    // Box
    let bw = stageW * 0.7; let bh = 48;
    let bx = x - bw/2; let by = H/2 - bh/2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 6);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = isRollback ? '#ef4444' : isActive ? '#f97316' : isDone ? '#22c55e' : 'rgba(148,163,184,0.5)';
    ctx.font = 'bold 10px Poppins,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(name, x, H/2);

    // Arrow
    if (i < stages.length - 1) {
      let arrowX = x + bw/2 + 2;
      ctx.strokeStyle = isRollback ? '#ef4444' : 'rgba(148,163,184,0.3)';
      ctx.lineWidth = isRollback ? 2 : 1;
      ctx.beginPath(); ctx.moveTo(arrowX, H/2); ctx.lineTo(arrowX + stageW*0.26, H/2); ctx.stroke();
    }
  });

  // Rollback indicator
  if (stepIdx === 3) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 11px Poppins,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('⚠️ ROLLBACK — Architectural State Cleared', W/2, H - 20);
    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px Poppins,sans-serif';
    ctx.fillText('Cache NOT rolled back — side channel remains', W/2, H - 8);
  } else if (stepIdx === 1 || stepIdx === 2) {
    ctx.fillStyle = '#f97316';
    ctx.font = '10px Poppins,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('⚡ Speculative execution in flight...', W/2, H - 20);
  }

  // Update side panels
  let step = SV_S0_STEPS[stepIdx] || {};
  let regEl = document.getElementById('svReg0');
  let cacheEl = document.getElementById('svCache0');
  if (regEl) regEl.textContent = step.reg || '—';
  if (cacheEl) cacheEl.textContent = step.cache || '—';

  // Update step indicators
  document.querySelectorAll('#svStep0Steps .sv-exp-step').forEach(function(el, i) {
    el.classList.remove('active', 'done');
    if (i < stepIdx) el.classList.add('done');
    else if (i === stepIdx) el.classList.add('active');
  });

  let labelEl = document.getElementById('svLabel0');
  if (labelEl) labelEl.textContent = step.label || (stepIdx === -1 ? 'Click Play to begin' : 'Complete');
}

function svPlayStage0() {
  if (svState.stage0Playing) {
    svState.stage0Playing = false;
    if (svState.stage0Timer) { clearTimeout(svState.stage0Timer); svState.stage0Timer = null; }
    let playBtn = document.getElementById('svPlay0');
    if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
    return;
  }

  if (svState.stage0Step >= SV_S0_STEPS.length - 1) svState.stage0Step = -1;

  svState.stage0Playing = true;
  let playBtn = document.getElementById('svPlay0');
  if (playBtn) playBtn.innerHTML = '<i class="fas fa-pause"></i>';

  function tick() {
    if (!svState.stage0Playing) return;
    svState.stage0Step++;
    svDrawStage0(svState.stage0Step);
    svUpdateS0Btns();
    if (svState.stage0Step < SV_S0_STEPS.length - 1) {
      svState.stage0Timer = setTimeout(tick, 1200);
    } else {
      svState.stage0Playing = false;
      if (playBtn) playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
  }
  tick();
}

function svUpdateS0Btns() {
  let prevBtn = document.getElementById('svPrev0');
  let nextBtn = document.getElementById('svNext0');
  if (prevBtn) prevBtn.disabled = svState.stage0Step <= 0;
  if (nextBtn) nextBtn.disabled = svState.stage0Step >= SV_S0_STEPS.length - 1;
}

/* ─── Stage 1: FSM + training ─── */
let SV_FSM_STATES_LABELS = ['Strongly NT', 'Weakly NT', 'Weakly T', 'Strongly T'];

function svDrawStage1FSM(activeState) {
  let canvas = document.getElementById('svCanvas1');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth || 500;
  canvas.height = 220;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let W = canvas.width; let H = canvas.height;
  let positions = [W*0.12, W*0.37, W*0.62, W*0.87];
  let cy = H * 0.42;

  // Transition arrows (T = right, N = left)
  for (let i = 0; i < 3; i++) {
    let x1 = positions[i]; let x2 = positions[i+1];
    // T arrow (below, right)
    ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x1+22, cy+10); ctx.lineTo(x2-22, cy+10);
    ctx.stroke();
    // Arrow head
    ctx.fillStyle = '#22c55e';
    ctx.beginPath(); ctx.moveTo(x2-22,cy+10); ctx.lineTo(x2-29,cy+6); ctx.lineTo(x2-29,cy+14); ctx.fill();
    ctx.fillStyle = '#22c55e'; ctx.font = '9px Fira Code,monospace'; ctx.textAlign = 'center';
    ctx.fillText('T', (x1+x2)/2, cy+23);

    // N arrow (above, left)
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath(); ctx.moveTo(x2-22, cy-10); ctx.lineTo(x1+22, cy-10); ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.moveTo(x1+22,cy-10); ctx.lineTo(x1+29,cy-6); ctx.lineTo(x1+29,cy-14); ctx.fill();
    ctx.fillStyle = '#ef4444'; ctx.textAlign = 'center';
    ctx.fillText('N', (x1+x2)/2, cy-14);
  }

  // Nodes
  positions.forEach(function(x, i) {
    let isActive = i === activeState;
    ctx.beginPath();
    ctx.arc(x, cy, 20, 0, Math.PI*2);
    ctx.fillStyle = isActive ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.04)';
    ctx.fill();
    ctx.strokeStyle = isActive ? '#22c55e' : 'rgba(148,163,184,0.3)';
    ctx.lineWidth = isActive ? 2.5 : 1.5;
    ctx.stroke();

    ctx.fillStyle = isActive ? '#22c55e' : 'rgba(148,163,184,0.5)';
    ctx.font = (isActive ? 'bold ' : '') + '9px Poppins,sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(i, x, cy);

    // Label below
    ctx.font = '8px Poppins,sans-serif';
    ctx.fillStyle = isActive ? '#22c55e' : 'rgba(148,163,184,0.4)';
    ctx.textBaseline = 'top';
    ctx.fillText(SV_FSM_STATES_LABELS[i], x, cy + 26);
  });

  // Predict region label
  ctx.fillStyle = 'rgba(34,197,94,0.5)';
  ctx.font = 'bold 8px Poppins,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('← Predict NOT TAKEN  |  Predict TAKEN →', W/2, H - 15);
}

function svRunTraining() {
  let count = 5;
  svState.trainCount = 0;

  let boxesEl = document.getElementById('svTrainBoxes');
  if (boxesEl) boxesEl.innerHTML = '';

  let predState = document1 ? 1 : 1; // start weakly NT

  function addTrainingIteration(i) {
    if (i >= count) {
      let predStateEl = document.getElementById('svPredState');
      if (predStateEl) predStateEl.textContent = 'Strongly Taken (state 3) — fully trained!';
      return;
    }

    // In-bounds call: branch is TAKEN → move predictor toward Strongly Taken
    let newState = Math.min(3, predState + 1);
    predState = newState;
    svDrawStage1FSM(newState);

    let box = document.createElement('div');
    box.className = 'sv-train-box training';
    box.textContent = 'i=' + i;
    setTimeout(function() { box.className = 'sv-train-box in-bounds'; }, 300);
    if (boxesEl) boxesEl.appendChild(box);

    let predStateEl = document.getElementById('svPredState');
    if (predStateEl) predStateEl.textContent = SV_FSM_STATES_LABELS[newState] + ' (state ' + newState + ')';

    setTimeout(function() { addTrainingIteration(i+1); }, 600);
  }

  addTrainingIteration(0);
}

// Workaround for using document in function — just use window
let document1 = true;

/* ─── Stage 2: OOB Read ─── */
function svDrawStage2(step) {
  let canvas = document.getElementById('svCanvas2');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth || 500;
  canvas.height = 300;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let W = canvas.width; let H = canvas.height;
  let mit = svState.mitigation;

  // Draw memory map
  let regions = [
    { label: 'array1[ ]  (accessible)', color: '#06b6d4', h: 40, y: 20 },
    { label: '    x = out-of-bounds index →', color: '#f97316', h: 20, y: 65 },
    { label: 'SECRET MEMORY (kernel/other process)', color: '#ef4444', h: 50, y: 90 },
    { label: 'array2[256 × 512]  (probe buffer)', color: '#a855f7', h: 60, y: 170 },
  ];

  regions.forEach(function(r) {
    ctx.fillStyle = 'rgba(' + svHexToRgb(r.color) + ', 0.12)';
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(20, r.y, W-40, r.h, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = r.color;
    ctx.font = '10px Fira Code,monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(r.label, 28, r.y + r.h/2);
  });

  if (mit) {
    // Mitigation: no speculative read
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 11px Poppins,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🛡️ LFENCE: CPU waits for bounds check before speculating', W/2, H - 20);
    ctx.fillStyle = 'rgba(34,197,94,0.5)';
    ctx.font = '10px Poppins,sans-serif';
    ctx.fillText('No cache line loaded. Attack prevented.', W/2, H - 7);
    return;
  }

  if (step < 0) return;

  // Arrow from x to secret
  if (step >= 1) {
    ctx.strokeStyle = '#f97316'; ctx.lineWidth = 2; ctx.setLineDash([4,2]);
    ctx.beginPath(); ctx.moveTo(W/2, 85); ctx.lineTo(W/2, 115); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f97316';
    ctx.beginPath(); ctx.moveTo(W/2, 115); ctx.lineTo(W/2-6, 107); ctx.lineTo(W/2+6, 107); ctx.fill();
    ctx.font = 'bold 10px Fira Code,monospace'; ctx.textAlign = 'center';
    ctx.fillText('speculative read → SECRET_BYTE = ' + svState.secretByte, W/2, 160);
  }

  // Arrow from secret into array2
  if (step >= 2) {
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W/2, 145); ctx.lineTo(W/2, 168); ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.moveTo(W/2, 168); ctx.lineTo(W/2-6, 160); ctx.lineTo(W/2+6, 160); ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 10px Poppins,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🔥 Cache line array2[' + svState.secretByte + '×512] now HOT', W/2, H - 20);
  }

  if (step >= 3) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px Poppins,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('↩️ ROLLBACK: registers cleared — but cache line stays!', W/2, H - 7);
  }
}

function svHexToRgb(hex) {
  let r = parseInt(hex.slice(1,3),16);
  let g = parseInt(hex.slice(3,5),16);
  let b = parseInt(hex.slice(5,7),16);
  return r + ',' + g + ',' + b;
}

function svRunOobStep() {
  svState.oobStep++;
  if (svState.oobStep >= 4) svState.oobStep = 3;

  // Update step visuals
  let steps = ['svOob0','svOob1','svOob2','svOob3'];
  steps.forEach(function(id, i) {
    let el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('active','done','danger','pending');
    if (i < svState.oobStep)  el.classList.add('done');
    else if (i === svState.oobStep) {
      el.classList.add(i === 3 ? 'danger' : 'active');
    } else el.classList.add('pending');
  });

  svState.cacheHotLine = svState.mitigation ? -1 : svState.secretByte;
  svDrawStage2(svState.oobStep);

  let mit2 = document.getElementById('svMitEffect2');
  if (mit2) mit2.classList.toggle('hidden', !svState.mitigation);
}

/* ─── Stage 3: Cache Timing ─── */
function svDrawStage3Empty() {
  let canvas = document.getElementById('svCanvas3');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth || 500;
  canvas.height = 300;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(148,163,184,0.3)';
  ctx.font = '12px Poppins,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Run the timing measurement to see results', canvas.width/2, canvas.height/2);
}

function svRunTimingMeasurement() {
  let canvas = document.getElementById('svCanvas3');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth || 500;
  canvas.height = 300;
  let ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let secret = svState.secretByte;
  let mit = svState.mitigation;
  let cacheHot = mit ? -1 : svState.cacheHotLine;

  let W = canvas.width; let H = canvas.height;
  let pad = { top: 20, right: 15, bottom: 30, left: 45 };
  let plotW = W - pad.left - pad.right;
  let plotH = H - pad.top - pad.bottom;

  // Generate timing data for all 256 possible byte values
  let timings = [];
  for (let i = 0; i < 256; i++) {
    let base = 180 + Math.random() * 40; // cache miss: ~180-220 cycles
    let isHot = i === cacheHot;
    timings.push(isHot ? (5 + Math.random() * 6) : base); // cache hit: ~5-11 cycles
  }

  let maxT = Math.max.apply(null, timings);
  let barW = plotW / 256;

  // Grid line at cache hit threshold
  let hitThreshold = 50;
  let hitY = pad.top + (1 - hitThreshold/maxT) * plotH;
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.setLineDash([3,2]);
  ctx.beginPath(); ctx.moveTo(pad.left, hitY); ctx.lineTo(W-pad.right, hitY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(148,163,184,0.4)'; ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'right';
  ctx.fillText('hit ~50', pad.left - 3, hitY + 3);

  // Bars
  timings.forEach(function(t, i) {
    let h = (t / maxT) * plotH;
    let x = pad.left + i * barW;
    let y = pad.top + plotH - h;
    let isHot = i === cacheHot;

    ctx.fillStyle = isHot ? '#ef4444' : 'rgba(148,163,184,0.2)';
    ctx.fillRect(x, y, Math.max(barW - 0.5, 0.5), h);
  });

  // Axes
  ctx.strokeStyle = 'rgba(148,163,184,0.2)'; ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top+plotH);
  ctx.lineTo(W-pad.right, pad.top+plotH); ctx.stroke();

  // X label
  ctx.fillStyle = 'rgba(148,163,184,0.5)'; ctx.font = '8px Poppins,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Byte value i (0–255)', pad.left + plotW/2, H - 5);
  // Y label (rotated)
  ctx.save();
  ctx.translate(10, pad.top + plotH/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillText('cycles', 0, 0);
  ctx.restore();

  // Mark the hot line
  if (cacheHot >= 0) {
    let hotX = pad.left + cacheHot * barW;
    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 1;
    ctx.setLineDash([3,2]);
    ctx.beginPath(); ctx.moveTo(hotX + barW/2, pad.top); ctx.lineTo(hotX + barW/2, pad.top+plotH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ef4444'; ctx.font = 'bold 9px Fira Code,monospace'; ctx.textAlign = 'center';
    ctx.fillText('i=' + cacheHot, hotX + barW/2, pad.top - 5);
  }

  // Show result
  let resultEl = document.getElementById('svTimingResult');
  let verdictEl = document.getElementById('svTimingVerdict');
  let detailEl = document.getElementById('svTimingDetail');
  let hintEl = document.getElementById('svCacheHint');
  let mit3 = document.getElementById('svMitEffect3');

  if (resultEl) resultEl.classList.remove('hidden');
  if (mit3) mit3.classList.toggle('hidden', !mit);

  if (mit) {
    if (verdictEl) {
      verdictEl.className = 'sv-timing-verdict blocked';
      verdictEl.textContent = '🛡️ Attack BLOCKED — all 256 lines measure ~200 cycles (cache miss). Secret byte unknown.';
    }
    if (detailEl) detailEl.textContent = 'With LFENCE mitigation active, no speculative read occurred, so no cache line was pre-loaded. The timing oracle reveals nothing.';
    if (hintEl) hintEl.textContent = 'All bars are tall (cache miss ~200 cycles). No information leaked.';
  } else {
    if (verdictEl) {
      verdictEl.className = 'sv-timing-verdict found';
      verdictEl.textContent = '💀 Secret byte RECOVERED: i=' + cacheHot + ' = 0x' + cacheHot.toString(16).toUpperCase() + ' = \'' + String.fromCharCode(cacheHot) + '\'';
    }
    if (detailEl) detailEl.textContent = 'One cache line — array2[' + cacheHot + '×512] — accessed in ~' + (5 + Math.random()*5).toFixed(0) + ' cycles instead of ~200 cycles. That i value = ' + cacheHot + ' is the secret byte, revealed purely through timing.';
    if (hintEl) hintEl.textContent = 'The red bar (i=' + cacheHot + ') is dramatically shorter than all others — that cache line is hot.';
  }
}

/* ─── Mitigation toggle ─── */
function svHandleMitToggle() {
  let check = document.getElementById('svMitigation');
  let stateEl = document.getElementById('svMitState');
  svState.mitigation = check.checked;
  if (stateEl) {
    stateEl.textContent = svState.mitigation ? 'ON — protected' : 'OFF — vulnerable';
    stateEl.className = 'sv-mit-state' + (svState.mitigation ? ' on' : '');
  }

  // Re-render current stage if it's 2 or 3
  if (svState.currentStage === 2) svDrawStage2(svState.oobStep);
  if (svState.currentStage === 3) {
    svDrawStage3Empty();
    // Hide previous results
    let resultEl = document.getElementById('svTimingResult');
    if (resultEl) resultEl.classList.add('hidden');
    let mit3 = document.getElementById('svMitEffect3');
    if (mit3) mit3.classList.toggle('hidden', !svState.mitigation);
  }
}

/* ─── Secret byte input ─── */
function svHandleSecretChange() {
  let input = document.getElementById('svSecretByte');
  let val = parseInt(input.value);
  if (!isNaN(val) && val >= 0 && val <= 255) svState.secretByte = val;
  // Update display in stage 2
  document.querySelectorAll('.sv-secret-val').forEach(function(el) { el.textContent = svState.secretByte; });
}

/* ─── Init ─── */
function svInit() {
  // Stage nav buttons
  document.querySelectorAll('.sv-stage-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      svGotoStage(parseInt(btn.getAttribute('data-stage')));
    });
  });

  document.querySelectorAll('.sv-dot').forEach(function(dot) {
    dot.addEventListener('click', function() {
      svGotoStage(parseInt(dot.getAttribute('data-stage')));
    });
  });

  let prevBtn = document.getElementById('svPrevStage');
  let nextBtn = document.getElementById('svNextStage');
  if (prevBtn) prevBtn.addEventListener('click', function() { svGotoStage(svState.currentStage - 1); });
  if (nextBtn) nextBtn.addEventListener('click', function() { svGotoStage(svState.currentStage + 1); });

  // Stage 0 playback
  let playBtn0 = document.getElementById('svPlay0');
  let prev0    = document.getElementById('svPrev0');
  let next0    = document.getElementById('svNext0');

  if (playBtn0) playBtn0.addEventListener('click', svPlayStage0);

  if (prev0) prev0.addEventListener('click', function() {
    svState.stage0Step = Math.max(-1, svState.stage0Step - 1);
    svDrawStage0(svState.stage0Step);
    svUpdateS0Btns();
  });

  if (next0) next0.addEventListener('click', function() {
    svState.stage0Step = Math.min(SV_S0_STEPS.length - 1, svState.stage0Step + 1);
    svDrawStage0(svState.stage0Step);
    svUpdateS0Btns();
  });

  // Stage 1 training
  let trainBtn = document.getElementById('svTrainBtn');
  if (trainBtn) trainBtn.addEventListener('click', svRunTraining);

  // Stage 2 OOB
  let oobBtn = document.getElementById('svOobBtn');
  if (oobBtn) oobBtn.addEventListener('click', svRunOobStep);

  // Stage 3 timing
  let timingBtn = document.getElementById('svTimingBtn');
  if (timingBtn) timingBtn.addEventListener('click', svRunTimingMeasurement);

  let secretInput = document.getElementById('svSecretByte');
  if (secretInput) secretInput.addEventListener('input', svHandleSecretChange);

  // Mitigation toggle
  let mitCheck = document.getElementById('svMitigation');
  if (mitCheck) mitCheck.addEventListener('change', svHandleMitToggle);

  // Initial state
  svGotoStage(0);
  svUpdateS0Btns();
  svDrawStage0(-1);
}

// Polyfill roundRect for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    this.beginPath();
    this.moveTo(x+r, y);
    this.lineTo(x+w-r, y);
    this.quadraticCurveTo(x+w, y, x+w, y+r);
    this.lineTo(x+w, y+h-r);
    this.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    this.lineTo(x+r, y+h);
    this.quadraticCurveTo(x, y+h, x, y+h-r);
    this.lineTo(x, y+r);
    this.quadraticCurveTo(x, y, x+r, y);
    this.closePath();
  };
}