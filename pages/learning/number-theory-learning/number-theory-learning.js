// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Number Theory Learning page logic only
// All globals prefixed nt_ or NT_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  ntInitProgress();
  ntInitGcd();
  ntInitSieve();
  ntInitFactorize();
  ntInitModular();
  ntInitFastExpo();
  ntInitEuler();
  ntInitCrt();
  ntRenderExercises();
  ntInitSidebarHighlight();
});

/* ─── Progress ─── */
var NT_TOPICS = ['gcd','sieve','primefact','modular','fastexpo','euler','crt'];

function ntInitProgress() {
  var saved = ntLoadProgress();
  NT_TOPICS.forEach(function(t) {
    var chk = document.querySelector('.nt-done-check[data-topic="' + t + '"]');
    if (!chk) return;
    if (saved[t]) chk.checked = true;
    chk.addEventListener('change', function() {
      saved[t] = chk.checked;
      ntSaveProgress(saved);
      ntUpdateProgressBar(saved);
    });
  });
  ntUpdateProgressBar(saved);

  var total = document.getElementById('ntTotalCount');
  if (total) total.textContent = NT_TOPICS.length;
}

function ntUpdateProgressBar(saved) {
  var done = NT_TOPICS.filter(function(t) { return saved[t]; }).length;
  var pct  = Math.round((done / NT_TOPICS.length) * 100);
  var fill = document.getElementById('ntProgressFill');
  var cnt  = document.getElementById('ntDoneCount');
  if (fill) fill.style.width = pct + '%';
  if (cnt)  cnt.textContent  = done;
}

function ntSaveProgress(data) {
  try { localStorage.setItem('nt-learning-progress', JSON.stringify(data)); } catch(e) {}
}

function ntLoadProgress() {
  try {
    var d = localStorage.getItem('nt-learning-progress');
    return d ? JSON.parse(d) : {};
  } catch(e) { return {}; }
}

/* ─── Helpers ─── */
function ntBigInt(n) { return BigInt(Math.floor(n)); }

function ntGcd(a, b) {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { var t = b; b = a % b; a = t; }
  return a;
}

function ntModPow(base, exp, mod) {
  var result = BigInt(1);
  base = BigInt(base) % BigInt(mod);
  exp  = BigInt(exp);
  mod  = BigInt(mod);
  while (exp > 0n) {
    if (exp % 2n === 1n) result = result * base % mod;
    exp  = exp >> 1n;
    base = base * base % mod;
  }
  return result;
}

function ntHtml(el, html) { if (el) el.innerHTML = html; }

/* ─── 1. GCD Tracer ─── */
function ntInitGcd() {
  var btn = document.getElementById('ntGcdBtn');
  if (btn) btn.addEventListener('click', ntRunGcd);
}

function ntRunGcd() {
  var a = parseInt(document.getElementById('ntGcdA').value);
  var b = parseInt(document.getElementById('ntGcdB').value);
  var el = document.getElementById('ntGcdTrace');
  if (!el) return;

  if (isNaN(a) || isNaN(b) || a < 0 || b < 0) {
    ntHtml(el, '<div class="nt-trace-error">Please enter non-negative integers.</div>');
    return;
  }

  var rows  = '';
  var oa = a, ob = b;
  var step  = 1;

  while (b !== 0) {
    var rem = a % b;
    rows += '<div class="nt-trace-row">' +
      '<span class="nt-trace-step">Step ' + step + '</span>' +
      '<span class="nt-trace-val">gcd(' + a + ', ' + b + ')</span>' +
      '<span class="nt-trace-note">→ gcd(' + b + ', ' + a + ' % ' + b + ' = ' + rem + ')</span>' +
    '</div>';
    a = b; b = rem; step++;
  }

  rows += '<div class="nt-trace-row">' +
    '<span class="nt-trace-step">Step ' + step + '</span>' +
    '<span class="nt-trace-val">gcd(' + a + ', 0)</span>' +
    '<span class="nt-trace-note">→ base case: return ' + a + '</span>' +
  '</div>';

  var gcdVal = a;
  var lcmVal = (oa / gcdVal) * ob;

  rows += '<div class="nt-trace-result">GCD(' + oa + ', ' + ob + ') = ' + gcdVal + ' &nbsp;|&nbsp; LCM = ' + oa + ' × ' + ob + ' / ' + gcdVal + ' = ' + lcmVal + '</div>';
  ntHtml(el, rows);
}

/* ─── 2. Sieve of Eratosthenes ─── */
var ntSieveState = { n: 0, isPrime: [], steps: [], stepIdx: 0, timer: null };

function ntInitSieve() {
  var runBtn   = document.getElementById('ntSieveRunBtn');
  var stepBtn  = document.getElementById('ntSieveStepBtn');
  var resetBtn = document.getElementById('ntSieveResetBtn');
  if (runBtn)   runBtn.addEventListener('click',   ntSieveRun);
  if (stepBtn)  stepBtn.addEventListener('click',  ntSieveStep);
  if (resetBtn) resetBtn.addEventListener('click', ntSieveReset);
  ntSieveRenderGrid(50);
}

function ntSieveBuildGrid(n) {
  var grid = document.getElementById('ntSieveGrid');
  if (!grid) return;
  var html = '';
  for (var i = 2; i <= n; i++) {
    html += '<div class="nt-sieve-cell" id="ntSCell' + i + '">' + i + '</div>';
  }
  grid.innerHTML = html;
}

function ntSieveRenderGrid(n) {
  ntSieveState.n      = n;
  ntSieveState.isPrime = new Array(n + 1).fill(true);
  ntSieveState.isPrime[0] = ntSieveState.isPrime[1] = false;
  ntSieveBuildGrid(n);
  ntSieveGenSteps(n);
  ntSieveState.stepIdx = 0;
  ntHtml(document.getElementById('ntSieveStatus'), 'Press <strong>Step</strong> or <strong>Run</strong> to animate.');
  ntHtml(document.getElementById('ntSieveResult'), '');
}

function ntSieveGenSteps(n) {
  var steps = [];
  var isPrime = new Array(n + 1).fill(true);
  isPrime[0] = isPrime[1] = false;

  for (var p = 2; p * p <= n; p++) {
    if (isPrime[p]) {
      steps.push({ type: 'prime', p: p, msg: 'p = ' + p + ' is prime. Marking multiples starting from p² = ' + (p*p) });
      for (var m = p * p; m <= n; m += p) {
        isPrime[m] = false;
        steps.push({ type: 'mark', p: p, m: m, msg: 'Mark ' + m + ' = ' + p + ' × ' + Math.floor(m/p) + ' as composite' });
      }
    }
  }

  steps.push({ type: 'done', msg: 'Sieve complete.' });
  ntSieveState.steps   = steps;
  ntSieveState.isPrime = isPrime;
}

function ntSieveApplyStep(step) {
  var status = document.getElementById('ntSieveStatus');
  if (status) status.textContent = step.msg;

  if (step.type === 'prime') {
    var cell = document.getElementById('ntSCell' + step.p);
    if (cell) { cell.className = 'nt-sieve-cell current'; }
  } else if (step.type === 'mark') {
    var cell2 = document.getElementById('ntSCell' + step.m);
    if (cell2) cell2.className = 'nt-sieve-cell marking';
    setTimeout(function(m) {
      var c = document.getElementById('ntSCell' + m);
      if (c) c.className = 'nt-sieve-cell composite';
    }, 150, step.m);
    var pcell = document.getElementById('ntSCell' + step.p);
    if (pcell) pcell.className = 'nt-sieve-cell current';
  } else if (step.type === 'done') {
    // Mark all remaining as prime
    for (var i = 2; i <= ntSieveState.n; i++) {
      var c2 = document.getElementById('ntSCell' + i);
      if (c2 && ntSieveState.isPrime[i]) c2.className = 'nt-sieve-cell prime';
    }
    var primes = [];
    for (var j = 2; j <= ntSieveState.n; j++) {
      if (ntSieveState.isPrime[j]) primes.push(j);
    }
    var res = document.getElementById('ntSieveResult');
    if (res) res.textContent = 'Primes up to ' + ntSieveState.n + ' (' + primes.length + ' total): ' + primes.join(', ');
  }
}

function ntSieveStep() {
  if (ntSieveState.stepIdx >= ntSieveState.steps.length) return;
  ntSieveApplyStep(ntSieveState.steps[ntSieveState.stepIdx]);
  ntSieveState.stepIdx++;
}

function ntSieveRun() {
  if (ntSieveState.timer) clearInterval(ntSieveState.timer);
  var nEl = document.getElementById('ntSieveN');
  var n   = parseInt(nEl ? nEl.value : 50);
  if (isNaN(n) || n < 4 || n > 100) { n = 50; if (nEl) nEl.value = 50; }
  ntSieveRenderGrid(n);

  ntSieveState.timer = setInterval(function() {
    if (ntSieveState.stepIdx >= ntSieveState.steps.length) {
      clearInterval(ntSieveState.timer);
      return;
    }
    ntSieveApplyStep(ntSieveState.steps[ntSieveState.stepIdx]);
    ntSieveState.stepIdx++;
  }, 120);
}

function ntSieveReset() {
  if (ntSieveState.timer) clearInterval(ntSieveState.timer);
  var nEl = document.getElementById('ntSieveN');
  var n   = parseInt(nEl ? nEl.value : 50);
  if (isNaN(n) || n < 4 || n > 100) n = 50;
  ntSieveRenderGrid(n);
}

/* ─── 3. Prime Factorization ─── */
function ntInitFactorize() {
  var btn = document.getElementById('ntFactBtn');
  if (btn) btn.addEventListener('click', ntRunFactorize);
}

function ntRunFactorize() {
  var nEl = document.getElementById('ntFactN');
  var el  = document.getElementById('ntFactTrace');
  var n   = parseInt(nEl ? nEl.value : 360);
  if (!el || isNaN(n) || n < 2) {
    ntHtml(el, '<div class="nt-trace-error">Enter an integer ≥ 2.</div>');
    return;
  }

  var orig  = n;
  var rows  = '';
  var facts = [];
  var d     = 2;
  var step  = 1;

  while (d * d <= n) {
    while (n % d === 0) {
      facts.push(d);
      rows += '<div class="nt-trace-row">' +
        '<span class="nt-trace-step">Step ' + step + '</span>' +
        '<span class="nt-trace-val">' + n + ' ÷ ' + d + ' = ' + (n / d) + '</span>' +
        '<span class="nt-trace-note">factor: ' + d + '</span>' +
      '</div>';
      n = n / d;
      step++;
    }
    d++;
  }

  if (n > 1) {
    facts.push(n);
    rows += '<div class="nt-trace-row">' +
      '<span class="nt-trace-step">Step ' + step + '</span>' +
      '<span class="nt-trace-val">Remaining: ' + n + '</span>' +
      '<span class="nt-trace-note">' + n + ' is prime</span>' +
    '</div>';
  }

  // Build exponent map
  var expMap = {};
  facts.forEach(function(f) { expMap[f] = (expMap[f] || 0) + 1; });
  var factStr = Object.keys(expMap).map(function(k) {
    return expMap[k] > 1 ? k + '^' + expMap[k] : k;
  }).join(' × ');

  rows += '<div class="nt-trace-result">' + orig + ' = ' + factStr + '</div>';
  ntHtml(el, rows);
}

/* ─── 4. Modular Arithmetic ─── */
function ntInitModular() {
  var btn = document.getElementById('ntModBtn');
  if (btn) btn.addEventListener('click', ntRunModular);
}

function ntRunModular() {
  var aEl = document.getElementById('ntModA');
  var bEl = document.getElementById('ntModB');
  var mEl = document.getElementById('ntModM');
  var el  = document.getElementById('ntModTrace');

  var a = parseInt(aEl ? aEl.value : 0);
  var b = parseInt(bEl ? bEl.value : 0);
  var m = parseInt(mEl ? mEl.value : 1000000007);

  if (!el || isNaN(a) || isNaN(b) || isNaN(m) || m <= 0) {
    ntHtml(el, '<div class="nt-trace-error">Enter valid integers. Modulus must be positive.</div>');
    return;
  }

  var aBig = BigInt(a), bBig = BigInt(b), mBig = BigInt(m);
  var amod = ((aBig % mBig) + mBig) % mBig;
  var bmod = ((bBig % mBig) + mBig) % mBig;

  var addRes  = (amod + bmod) % mBig;
  var subRes  = ((amod - bmod) + mBig) % mBig;
  var mulRes  = amod * bmod % mBig;

  // Modular inverse of b (only if gcd(b,m)=1 and m is prime-ish — use fast pow)
  var invExists = ntGcd(Math.abs(b), m) === 1;
  var invRes    = invExists ? ntModPow(b, m - 2, m) : null;
  var divRes    = invExists ? amod * invRes % mBig : null;

  var rows = '';
  rows += '<div class="nt-trace-row"><span class="nt-trace-step">(a+b) % m</span><span class="nt-trace-val">' + addRes + '</span><span class="nt-trace-note">= (' + amod + ' + ' + bmod + ') % ' + m + '</span></div>';
  rows += '<div class="nt-trace-row"><span class="nt-trace-step">(a-b) % m</span><span class="nt-trace-val">' + subRes + '</span><span class="nt-trace-note">= (' + amod + ' - ' + bmod + ' + m) % ' + m + '</span></div>';
  rows += '<div class="nt-trace-row"><span class="nt-trace-step">(a×b) % m</span><span class="nt-trace-val">' + mulRes + '</span><span class="nt-trace-note">= ' + amod + ' × ' + bmod + ' % ' + m + '</span></div>';

  if (invExists && invRes !== null) {
    rows += '<div class="nt-trace-row"><span class="nt-trace-step">b⁻¹ mod m</span><span class="nt-trace-val">' + invRes + '</span><span class="nt-trace-note">= b^(m-2) mod m (Fermat)</span></div>';
    rows += '<div class="nt-trace-row"><span class="nt-trace-step">(a÷b) % m</span><span class="nt-trace-val">' + divRes + '</span><span class="nt-trace-note">= a × b⁻¹ % m</span></div>';
  } else {
    rows += '<div class="nt-trace-row"><span class="nt-trace-step">b⁻¹ mod m</span><span class="nt-trace-error">gcd(b, m) ≠ 1 — inverse does not exist</span></div>';
  }

  ntHtml(el, rows);
}

/* ─── 5. Fast Exponentiation ─── */
function ntInitFastExpo() {
  var btn = document.getElementById('ntExpBtn');
  if (btn) btn.addEventListener('click', ntRunFastExpo);
}

function ntRunFastExpo() {
  var baseEl = document.getElementById('ntExpBase');
  var nEl    = document.getElementById('ntExpN');
  var modEl  = document.getElementById('ntExpMod');
  var el     = document.getElementById('ntExpTrace');

  var base = parseInt(baseEl ? baseEl.value : 2);
  var exp  = parseInt(nEl ? nEl.value : 10);
  var mod  = parseInt(modEl ? modEl.value : 1000000007);

  if (!el || isNaN(base) || isNaN(exp) || isNaN(mod) || mod <= 0 || exp < 0) {
    ntHtml(el, '<div class="nt-trace-error">Enter valid non-negative integers. Mod must be positive.</div>');
    return;
  }

  var rows   = '';
  var result = BigInt(1);
  var b      = BigInt(base) % BigInt(mod);
  var e      = BigInt(exp);
  var m      = BigInt(mod);
  var origE  = exp;
  var step   = 1;

  rows += '<div class="nt-trace-row">' +
    '<span class="nt-trace-step">Binary of ' + exp + '</span>' +
    '<span class="nt-trace-val">' + exp.toString(2) + '</span>' +
    '<span class="nt-trace-note">= bits to process (LSB first)</span>' +
  '</div>';

  while (e > 0n) {
    var bit = e % 2n;
    rows += '<div class="nt-trace-row">' +
      '<span class="nt-trace-step">Step ' + step + '</span>' +
      '<span class="nt-trace-val">exp=' + e + ', bit=' + bit + ', base=' + b + '</span>' +
      '<span class="nt-trace-note">' + (bit === 1n ? 'result = result × base = ' + (result * b % m) : 'bit=0, skip multiply') + '</span>' +
    '</div>';
    if (bit === 1n) result = result * b % m;
    e = e >> 1n;
    b = b * b % m;
    step++;
  }

  rows += '<div class="nt-trace-result">' + base + '^' + origE + ' mod ' + mod + ' = ' + result + '</div>';
  ntHtml(el, rows);
}

/* ─── 6. Euler's Totient ─── */
function ntInitEuler() {
  var btn = document.getElementById('ntEulerBtn');
  if (btn) btn.addEventListener('click', ntRunEuler);
}

function ntRunEuler() {
  var nEl = document.getElementById('ntEulerN');
  var el  = document.getElementById('ntEulerTrace');
  var n   = parseInt(nEl ? nEl.value : 36);

  if (!el || isNaN(n) || n < 1) {
    ntHtml(el, '<div class="nt-trace-error">Enter a positive integer.</div>');
    return;
  }

  var rows   = '';
  var orig   = n;
  var result = n;
  var p      = 2;
  var step   = 1;

  rows += '<div class="nt-trace-row">' +
    '<span class="nt-trace-step">Start</span>' +
    '<span class="nt-trace-val">φ(' + orig + ') = ' + orig + '</span>' +
    '<span class="nt-trace-note">initialized to n</span>' +
  '</div>';

  while (p * p <= n) {
    if (n % p === 0) {
      while (n % p === 0) n = Math.floor(n / p);
      result = result - Math.floor(result / p);
      rows += '<div class="nt-trace-row">' +
        '<span class="nt-trace-step">Step ' + step + '</span>' +
        '<span class="nt-trace-val">prime factor p=' + p + '</span>' +
        '<span class="nt-trace-note">result *= (1 - 1/' + p + ') → result = ' + result + '</span>' +
      '</div>';
      step++;
    }
    p++;
  }

  if (n > 1) {
    result = result - Math.floor(result / n);
    rows += '<div class="nt-trace-row">' +
      '<span class="nt-trace-step">Step ' + step + '</span>' +
      '<span class="nt-trace-val">remaining prime p=' + n + '</span>' +
      '<span class="nt-trace-note">result *= (1 - 1/' + n + ') → result = ' + result + '</span>' +
    '</div>';
  }

  // Verify by brute force for small n
  var bruteCount = 0;
  if (orig <= 1000) {
    for (var i = 1; i <= orig; i++) if (ntGcd(i, orig) === 1) bruteCount++;
    rows += '<div class="nt-trace-row"><span class="nt-trace-step">Verify</span><span class="nt-trace-val">Brute force count: ' + bruteCount + '</span><span class="nt-trace-note">integers from 1 to ' + orig + ' coprime to ' + orig + '</span></div>';
  }

  rows += '<div class="nt-trace-result">φ(' + orig + ') = ' + result + '</div>';
  ntHtml(el, rows);
}

/* ─── 7. CRT ─── */
function ntInitCrt() {
  var btn = document.getElementById('ntCrtBtn');
  if (btn) btn.addEventListener('click', ntRunCrt);
}

function ntRunCrt() {
  var aEl = document.getElementById('ntCrtA');
  var mEl = document.getElementById('ntCrtM');
  var bEl = document.getElementById('ntCrtB');
  var nEl = document.getElementById('ntCrtN');
  var el  = document.getElementById('ntCrtTrace');

  var a = parseInt(aEl ? aEl.value : 0);
  var m = parseInt(mEl ? mEl.value : 3);
  var b = parseInt(bEl ? bEl.value : 0);
  var n = parseInt(nEl ? nEl.value : 5);

  if (!el || isNaN(a) || isNaN(m) || isNaN(b) || isNaN(n) || m <= 0 || n <= 0) {
    ntHtml(el, '<div class="nt-trace-error">Enter valid positive integers for m and n.</div>');
    return;
  }

  var g = ntGcd(m, n);
  if (g !== 1) {
    ntHtml(el, '<div class="nt-trace-error">gcd(m, n) = ' + g + ' ≠ 1. CRT requires pairwise coprime moduli.</div>');
    return;
  }

  var rows = '';
  rows += '<div class="nt-trace-row"><span class="nt-trace-step">Given</span><span class="nt-trace-val">x ≡ ' + a + ' (mod ' + m + ')  and  x ≡ ' + b + ' (mod ' + n + ')</span></div>';
  rows += '<div class="nt-trace-row"><span class="nt-trace-step">Check</span><span class="nt-trace-val">gcd(' + m + ', ' + n + ') = ' + g + ' ✅</span><span class="nt-trace-note">CRT applicable</span></div>';

  // Find modular inverse of m mod n using fast pow (n may not be prime — use extended GCD approach)
  // Since gcd(m,n)=1, use iterative extended GCD
  function modInv(a, m) {
    var m0 = m, x0 = 0, x1 = 1;
    a = ((a % m) + m) % m;
    if (m === 1) return 0;
    while (a > 1) {
      var q = Math.floor(a / m);
      var t = m;
      m = a % m; a = t;
      t = x0; x0 = x1 - q * x0; x1 = t;
    }
    return x1 < 0 ? x1 + m0 : x1;
  }

  var inv_m_n = modInv(m, n);
  rows += '<div class="nt-trace-row"><span class="nt-trace-step">Compute</span><span class="nt-trace-val">m⁻¹ mod n = ' + m + '⁻¹ mod ' + n + ' = ' + inv_m_n + '</span></div>';

  var diff = ((b - a) % n + n) % n;
  rows += '<div class="nt-trace-row"><span class="nt-trace-step">diff</span><span class="nt-trace-val">(b - a) mod n = (' + b + ' - ' + a + ') mod ' + n + ' = ' + diff + '</span></div>';

  var k = (diff * inv_m_n) % n;
  rows += '<div class="nt-trace-row"><span class="nt-trace-step">k</span><span class="nt-trace-val">diff × m⁻¹ mod n = ' + diff + ' × ' + inv_m_n + ' mod ' + n + ' = ' + k + '</span></div>';

  var x = a + m * k;
  var newMod = m * n;
  rows += '<div class="nt-trace-row"><span class="nt-trace-step">x</span><span class="nt-trace-val">a + m × k = ' + a + ' + ' + m + ' × ' + k + ' = ' + x + '</span></div>';

  // Verify
  var v1 = ((x % m) + m) % m;
  var v2 = ((x % n) + n) % n;
  var ok = v1 === ((a % m + m) % m) && v2 === ((b % n + n) % n);

  rows += '<div class="nt-trace-row"><span class="nt-trace-step">Verify</span><span class="nt-trace-val">' + x + ' mod ' + m + ' = ' + v1 + ' (' + (v1 === ((a%m+m)%m) ? '✅' : '❌') + ')  |  ' + x + ' mod ' + n + ' = ' + v2 + ' (' + (v2 === ((b%n+n)%n) ? '✅' : '❌') + ')</span></div>';

  rows += '<div class="nt-trace-result">x = ' + x + ' (mod ' + newMod + ')' + (ok ? ' ✅ Verified' : ' ❌ Check inputs') + '</div>';
  ntHtml(el, rows);
}

/* ─── Exercises ─── */
var NT_EXERCISES = [
  {
    num: 1, difficulty: 'easy', topic: 'GCD',
    q: 'What is gcd(48, 18)? Trace the Euclidean algorithm step by step.',
    a: 'gcd(48, 18) → gcd(18, 48%18=12) → gcd(12, 18%12=6) → gcd(6, 12%6=0) → <strong>gcd = 6</strong>. Use the interactive tracer above to verify.'
  },
  {
    num: 2, difficulty: 'easy', topic: 'Sieve',
    q: 'How many prime numbers are there between 1 and 50? List them.',
    a: 'There are <strong>15 primes</strong> up to 50: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47. Use the sieve above with N=50 to verify.'
  },
  {
    num: 3, difficulty: 'medium', topic: 'Prime Factorization',
    q: 'Express 720 as a product of prime factors. What is its prime factorization?',
    a: '720 = 2⁴ × 3² × 5. Trace: 720 → ÷2 → 360 → ÷2 → 180 → ÷2 → 90 → ÷2 → 45 → ÷3 → 15 → ÷3 → 5 → prime. Result: <strong>2⁴ × 3² × 5¹</strong>'
  },
  {
    num: 4, difficulty: 'medium', topic: 'Modular Arithmetic',
    q: 'Compute (999999999 × 999999998) mod (10⁹+7). What technique prevents overflow?',
    a: 'Use <code>(a % m) × (b % m) % m</code>. Both values are already < 10⁹+7, so: (999999999 × 999999998) % 1000000007. Using BigInt or 64-bit integers: <strong>result = 999999999 × 999999998 mod 10⁹+7 = 999999999000000006 mod 1000000007 = 6</strong>. The key: take mod at each multiplication step to avoid overflow.'
  },
  {
    num: 5, difficulty: 'medium', topic: 'Fast Exponentiation',
    q: 'Compute 2¹⁰ using binary exponentiation. Show each step and which bits cause a multiplication.',
    a: 'Binary of 10 = 1010. Process LSB to MSB:<br>Step 1: bit=0, skip, base=2²=4<br>Step 2: bit=1, result=1×4=4, base=4²=16<br>Step 3: bit=0, skip, base=16²=256<br>Step 4: bit=1, result=4×256=<strong>1024</strong>. Answer: 2¹⁰ = 1024 ✅'
  },
  {
    num: 6, difficulty: 'hard', topic: "Euler's Totient",
    q: "Compute φ(36). Show your work using the prime factorization formula.",
    a: '36 = 2² × 3². Using φ(n) = n × ∏(1 - 1/p):<br>φ(36) = 36 × (1 - 1/2) × (1 - 1/3) = 36 × 1/2 × 2/3 = <strong>12</strong>.<br>Verification: integers coprime to 36 from 1..36: {1,5,7,11,13,17,19,23,25,29,31,35} = 12 values ✅'
  },
  {
    num: 7, difficulty: 'hard', topic: 'CRT',
    q: 'Find x such that x ≡ 2 (mod 3), x ≡ 3 (mod 5), x ≡ 2 (mod 7).',
    a: 'Step 1: Combine first two: x ≡ 2 (mod 3) and x ≡ 3 (mod 5). gcd(3,5)=1. diff=(3-2)mod5=1. inv(3,5)=2. k=1×2=2. x=2+3×2=8 (mod 15).<br>Step 2: Combine x≡8(mod 15) with x≡2(mod 7). diff=(2-8 mod 7+7)%7=1. inv(15,7)=1. k=1×1=1. x=8+15×1=23 (mod 105).<br>Answer: <strong>x = 23 (mod 105)</strong>. Check: 23%3=2✅, 23%5=3✅, 23%7=2✅'
  },
  {
    num: 8, difficulty: 'medium', topic: 'Modular Arithmetic',
    q: 'What is the modular inverse of 3 modulo 7? Verify your answer.',
    a: 'We need x such that 3x ≡ 1 (mod 7).<br>By Fermat: 3^(7-2) mod 7 = 3^5 mod 7 = 243 mod 7 = <strong>5</strong>.<br>Verify: 3 × 5 = 15 ≡ 1 (mod 7) ✅'
  },
];

function ntRenderExercises() {
  var grid = document.getElementById('ntExercisesGrid');
  if (!grid) return;

  grid.innerHTML = NT_EXERCISES.map(function(ex) {
    var diffCls = { easy: 'nt-ex-easy', medium: 'nt-ex-medium', hard: 'nt-ex-hard' }[ex.difficulty] || 'nt-ex-easy';
    return '<div class="nt-exercise-card" id="ntEx' + ex.num + '">' +
      '<div class="nt-exercise-header">' +
        '<span class="nt-ex-num">Q' + ex.num + '</span>' +
        '<span class="nt-ex-difficulty ' + diffCls + '">' + ex.difficulty.charAt(0).toUpperCase() + ex.difficulty.slice(1) + '</span>' +
        '<span class="nt-ex-topic">' + ex.topic + '</span>' +
      '</div>' +
      '<div class="nt-ex-question">' + ex.q + '</div>' +
      '<button class="nt-ex-toggle" id="ntExToggle' + ex.num + '" aria-expanded="false">Show Answer</button>' +
      '<div class="nt-ex-answer hidden" id="ntExAnswer' + ex.num + '">' + ex.a + '</div>' +
    '</div>';
  }).join('');

  NT_EXERCISES.forEach(function(ex) {
    var btn = document.getElementById('ntExToggle' + ex.num);
    var ans = document.getElementById('ntExAnswer' + ex.num);
    if (!btn || !ans) return;
    btn.addEventListener('click', function() {
      var open = !ans.classList.contains('hidden');
      ans.classList.toggle('hidden', open);
      btn.textContent = open ? 'Show Answer' : 'Hide Answer';
      btn.setAttribute('aria-expanded', String(!open));
    });
  });
}

/* ─── Sidebar Highlight ─── */
function ntInitSidebarHighlight() {
  var sections = document.querySelectorAll('.nt-topic-section[id]');
  var links    = document.querySelectorAll('.nt-sidebar-link[data-topic]');

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (!entry.isIntersecting) return;
      var id = entry.target.id;
      links.forEach(function(link) {
        link.classList.toggle('active', link.getAttribute('data-topic') === id);
      });
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach(function(s) { observer.observe(s); });
}