/**
 * Algo-Infinity-Verse | ECC Finite Field Visualizer
 * Mathematically rigorously calculates and animates Point Addition over a Galois Field (modulo prime p).
 */

class ECCVisualizer {
  constructor() {
    // UI Inputs
    this.inputA = document.getElementById('input-a');
    this.inputB = document.getElementById('input-b');
    this.inputP = document.getElementById('input-p');
    this.btnUpdate = document.getElementById('btn-update-curve');
    this.curveStatus = document.getElementById('curve-status');

    this.selectP = document.getElementById('select-p');
    this.selectQ = document.getElementById('select-q');

    this.btnPlay = document.getElementById('btn-play');
    this.btnStep = document.getElementById('btn-step');
    this.btnReset = document.getElementById('btn-reset');

    this.statusText = document.getElementById('status-text');
    this.mathStream = document.getElementById('math-stream');

    this.valP = document.getElementById('val-p');
    this.valQ = document.getElementById('val-q');
    this.valR = document.getElementById('val-r');

    // Tabs Controls
    this.tabArithmetic = document.getElementById('tab-btn-arithmetic');
    this.tabECDH = document.getElementById('tab-btn-ecdh');
    this.tabECDSA = document.getElementById('tab-btn-ecdsa');

    this.panelArithmetic = document.getElementById('panel-arithmetic');
    this.panelECDH = document.getElementById('panel-ecdh');
    this.panelECDSA = document.getElementById('panel-ecdsa');

    this.inputK = document.getElementById('input-k');
    this.btnScalarMult = document.getElementById('btn-scalar-mult');

    this.selectGEcdh = document.getElementById('select-g-ecdh');
    this.inputDA = document.getElementById('input-da');
    this.inputDB = document.getElementById('input-db');
    this.btnEcdhRun = document.getElementById('btn-ecdh-run');
    this.resEcdhQa = document.getElementById('ecdh-qa');
    this.resEcdhQb = document.getElementById('ecdh-qb');
    this.resEcdhSecret = document.getElementById('ecdh-secret');

    this.selectGEcdsa = document.getElementById('select-g-ecdsa');
    this.inputEcdsaD = document.getElementById('input-ecdsa-d');
    this.inputEcdsaE = document.getElementById('input-ecdsa-e');
    this.inputEcdsaK = document.getElementById('input-ecdsa-k');
    this.btnEcdsaSign = document.getElementById('btn-ecdsa-sign');
    this.btnEcdsaVerify = document.getElementById('btn-ecdsa-verify');
    this.resEcdsaQ = document.getElementById('ecdsa-q');
    this.resEcdsaSig = document.getElementById('ecdsa-sig');
    this.resEcdsaVerifyRes = document.getElementById('ecdsa-verify-res');

    this.activeTab = 'arithmetic';
    this.ecdhState = null;
    this.ecdsaState = null;

    // Canvas setup
    this.canvas = document.getElementById('ecc-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Curve State
    this.a = 2;
    this.b = 2;
    this.p = 17;
    this.validPoints = [];

    // Operation State
    this.ptP = null;
    this.ptQ = null;
    this.ptR = null;
    this.ptNegR = null;
    this.slopeM = null;

    // Generator & Rendering State
    this.generator = null;
    this.isPlaying = false;
    this.animationPhase = 'IDLE'; // IDLE, DRAW_LINE, REFLECT, DONE
    this.animFrame = null;
    this.lineProgress = 0; // 0 to 1 for drawing line
    this.animSpeed = 1;

    this.init();
  }

  init() {
    this.bindEvents();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.updateCurveParameters();
  }

  bindEvents() {
    this.btnUpdate.addEventListener('click', () => this.updateCurveParameters());

    this.selectP.addEventListener('change', () => this.updateSelectedPoints());
    this.selectQ.addEventListener('change', () => this.updateSelectedPoints());

    this.btnPlay.addEventListener('click', () => {
      if (this.isPlaying) this.pauseAutoPlay();
      else this.startAutoPlay();
    });

    this.btnStep.addEventListener('click', () => {
      this.pauseAutoPlay();
      this.stepForward();
    });

    this.btnReset.addEventListener('click', () => {
      this.pauseAutoPlay();
      this.resetAnimation();
    });

    // Tab switches
    this.tabArithmetic.addEventListener('click', () => this.switchTab('arithmetic'));
    this.tabECDH.addEventListener('click', () => this.switchTab('ecdh'));
    this.tabECDSA.addEventListener('click', () => this.switchTab('ecdsa'));

    // Operation bindings
    this.btnScalarMult.addEventListener('click', () => {
      this.pauseAutoPlay();
      this.startScalarMult();
    });
    this.btnEcdhRun.addEventListener('click', () => {
      this.pauseAutoPlay();
      this.runEcdh();
    });
    this.btnEcdsaSign.addEventListener('click', () => {
      this.pauseAutoPlay();
      this.runEcdsaSign();
    });
    this.btnEcdsaVerify.addEventListener('click', () => {
      this.pauseAutoPlay();
      this.runEcdsaVerify();
    });

    this.selectGEcdh.addEventListener('change', () => this.resetAnimation());
    this.selectGEcdsa.addEventListener('change', () => this.resetAnimation());
  }

  resizeCanvas() {
    const wrapper = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = wrapper.clientWidth * dpr;
    this.canvas.height = wrapper.clientHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.renderCanvas(); // Redraw immediately
  }

  /* --- Core ECC Mathematics --- */

  // True mathematical modulo (handles negatives)
  mod(n, m) {
    return ((n % m) + m) % m;
  }

  // Extended Euclidean Algorithm for Modular Inverse
  modInverse(a, m) {
    let [m0, x0, x1] = [m, 0, 1];
    if (m === 1) return 0;
    a = this.mod(a, m);
    while (a > 1) {
      if (m === 0) return null; // No inverse
      let q = Math.floor(a / m);
      [m, a] = [a % m, m];
      [x0, x1] = [x1 - q * x0, x0];
    }
    return x1 < 0 ? x1 + m0 : x1;
  }

  addPoints(P, Q) {
    if (!P) return Q;
    if (!Q) return P;
    if (P.x === Q.x && P.y === this.mod(-Q.y, this.p)) {
      return null; // Point at infinity
    }
    let num, den;
    if (P.x === Q.x && P.y === Q.y) {
      num = this.mod(3 * Math.pow(P.x, 2) + this.a, this.p);
      den = this.mod(2 * P.y, this.p);
    } else {
      num = this.mod(Q.y - P.y, this.p);
      den = this.mod(Q.x - P.x, this.p);
    }
    let invDen = this.modInverse(den, this.p);
    if (invDen === null) return null;
    let m = this.mod(num * invDen, this.p);
    let rx = this.mod(m * m - P.x - Q.x, this.p);
    let ry = this.mod(m * (P.x - rx) - P.y, this.p);
    return { x: rx, y: ry };
  }

  multiplyPoint(k, P) {
    if (!P || k <= 0) return null;
    let R = null;
    let A = { x: P.x, y: P.y };
    let remainingK = k;
    while (remainingK > 0) {
      if (remainingK % 2 === 1) {
        R = this.addPoints(R, A);
      }
      A = this.addPoints(A, A);
      remainingK = Math.floor(remainingK / 2);
    }
    return R;
  }

  getPointOrder(G) {
    if (!G) return 0;
    let R = G;
    let count = 1;
    while (R !== null && count < 1000) {
      R = this.addPoints(R, G);
      count++;
    }
    return count;
  }

  updateCurveParameters() {
    this.a = parseInt(this.inputA.value);
    this.b = parseInt(this.inputB.value);
    this.p = parseInt(this.inputP.value);

    this.statusText.textContent = `y² ≡ x³ + ${this.a}x + ${this.b} (mod ${this.p})`;

    // Verify non-singular curve: 4a^3 + 27b^2 != 0 (mod p)
    let det = this.mod(4 * Math.pow(this.a, 3) + 27 * Math.pow(this.b, 2), this.p);
    if (det === 0) {
      this.curveStatus.textContent = 'Singular Curve (Invalid)';
      this.curveStatus.className = 'status-text mt-2 text-error';
      this.validPoints = [];
      this.populateSelects();
      return;
    }
    this.curveStatus.textContent = 'Curve is Valid';
    this.curveStatus.className = 'status-text mt-2 text-success';

    // Brute force all valid points for visualizer
    this.validPoints = [];
    for (let x = 0; x < this.p; x++) {
      let rhs = this.mod(Math.pow(x, 3) + this.a * x + this.b, this.p);
      for (let y = 0; y < this.p; y++) {
        let lhs = this.mod(y * y, this.p);
        if (lhs === rhs) {
          this.validPoints.push({ x, y });
        }
      }
    }

    this.populateSelects();
    this.resetAnimation();
  }

  populateSelects() {
    this.selectP.innerHTML = '';
    this.selectQ.innerHTML = '';
    this.selectGEcdh.innerHTML = '';
    this.selectGEcdsa.innerHTML = '';

    if (this.validPoints.length === 0) {
      this.selectP.innerHTML = '<option>None</option>';
      this.selectQ.innerHTML = '<option>None</option>';
      this.selectGEcdh.innerHTML = '<option>None</option>';
      this.selectGEcdsa.innerHTML = '<option>None</option>';
      return;
    }

    this.validPoints.forEach((pt, i) => {
      let str = `(${pt.x}, ${pt.y})`;
      this.selectP.add(new Option(str, i));
      // Select a different point for Q by default if possible
      this.selectQ.add(new Option(str, i, false, i === Math.min(1, this.validPoints.length - 1)));
      this.selectGEcdh.add(
        new Option(str, i, false, i === Math.min(1, this.validPoints.length - 1))
      );
      this.selectGEcdsa.add(
        new Option(str, i, false, i === Math.min(1, this.validPoints.length - 1))
      );
    });

    this.updateSelectedPoints();
  }

  updateSelectedPoints() {
    if (this.validPoints.length === 0) return;

    this.ptP = this.validPoints[this.selectP.value];
    this.ptQ = this.validPoints[this.selectQ.value];

    this.valP.textContent = `(${this.ptP.x}, ${this.ptP.y})`;
    this.valQ.textContent = `(${this.ptQ.x}, ${this.ptQ.y})`;

    this.resetAnimation();
  }

  switchTab(tab) {
    this.activeTab = tab;
    this.pauseAutoPlay();

    this.tabArithmetic.classList.toggle('active', tab === 'arithmetic');
    this.tabECDH.classList.toggle('active', tab === 'ecdh');
    this.tabECDSA.classList.toggle('active', tab === 'ecdsa');

    this.panelArithmetic.style.display = tab === 'arithmetic' ? 'block' : 'none';
    this.panelECDH.style.display = tab === 'ecdh' ? 'block' : 'none';
    this.panelECDSA.style.display = tab === 'ecdsa' ? 'block' : 'none';

    this.resetAnimation();
  }

  resetAnimation() {
    this.ptR = null;
    this.ptNegR = null;
    this.slopeM = null;
    this.animationPhase = 'IDLE';
    this.lineProgress = 0;
    this.valR.textContent = 'null';
    this.mathStream.innerHTML =
      '<div class="empty-stream">Press Animate to view point addition steps...</div>';

    this.generator = this.eccAdditionGenerator();
    this.btnStep.disabled = false;
    this.btnPlay.disabled = false;

    this.ecdhState = null;
    this.ecdsaState = null;

    if (this.resEcdhQa) {
      this.resEcdhQa.textContent = 'null';
      this.resEcdhQb.textContent = 'null';
      this.resEcdhSecret.textContent = 'null';
    }

    if (this.resEcdsaQ) {
      this.resEcdsaQ.textContent = 'null';
      this.resEcdsaSig.textContent = 'null';
      this.resEcdsaVerifyRes.textContent = 'null';
      this.resEcdsaVerifyRes.className = '';
    }

    this.renderCanvas();
  }

  /* --- Generator for Animation Steps --- */

  *eccAdditionGenerator() {
    this.mathStream.innerHTML = ''; // Clear stream
    this.logMath(
      `Start addition: P(${this.ptP.x}, ${this.ptP.y}) + Q(${this.ptQ.x}, ${this.ptQ.y})`
    );

    // Check for Point at Infinity (P = -Q)
    if (this.ptP.x === this.ptQ.x && this.ptP.y === this.mod(-this.ptQ.y, this.p)) {
      this.valR.textContent = 'O (Infinity)';
      this.logMath(`P and Q are inverses. Result is Point at Infinity O.`, 'hl-emerald');
      this.animationPhase = 'DONE';
      this.renderCanvas();
      return;
    }

    // Calculate Slope (m)
    let num, den;
    if (this.ptP.x === this.ptQ.x && this.ptP.y === this.ptQ.y) {
      // Point Doubling
      this.logMath(`P = Q. Calculating Tangent Line (Point Doubling).`);
      num = this.mod(3 * Math.pow(this.ptP.x, 2) + this.a, this.p);
      den = this.mod(2 * this.ptP.y, this.p);
      this.logMath(`m = (3x₁² + a) / (2y₁) mod p`);
    } else {
      // Point Addition
      this.logMath(`P ≠ Q. Calculating Secant Line (Point Addition).`);
      num = this.mod(this.ptQ.y - this.ptP.y, this.p);
      den = this.mod(this.ptQ.x - this.ptP.x, this.p);
      this.logMath(`m = (y₂ - y₁) / (x₂ - x₁) mod p`);
    }

    let invDen = this.modInverse(den, this.p);
    this.slopeM = this.mod(num * invDen, this.p);

    this.logMath(`Numerator: ${num}, Denominator: ${den}`);
    this.logMath(`Modular Inverse of ${den} mod ${this.p} is ${invDen}`, 'hl-cyan');
    this.logMath(`Slope (m) = ${num} * ${invDen} ≡ ${this.slopeM} (mod ${this.p})`);

    yield; // Pause

    // Calculate Intersection -R
    let rx = this.mod(Math.pow(this.slopeM, 2) - this.ptP.x - this.ptQ.x, this.p);
    let ry = this.mod(this.slopeM * (this.ptP.x - rx) - this.ptP.y, this.p);
    this.ptNegR = { x: rx, y: this.mod(-ry, this.p) }; // Internal math gives -R directly, but we need standard coordinates for rendering line intersection.

    // Wait, standard line eq: y - y1 = m(x - x1)
    let negRy = this.mod(this.slopeM * (rx - this.ptP.x) + this.ptP.y, this.p);
    this.ptNegR = { x: rx, y: negRy };

    this.animationPhase = 'DRAW_LINE';

    // Animate line drawing
    for (let i = 0; i <= 20; i++) {
      this.lineProgress = i / 20;
      this.renderCanvas();
      yield;
    }

    this.logMath(`Line intersects curve at -R(x₃, -y₃)`);
    this.logMath(`x₃ = m² - x₁ - x₂ ≡ ${rx} (mod ${this.p})`);
    this.logMath(`Intersection -R found at (${rx}, ${negRy})`);

    yield; // Pause at intersection

    // Reflect to R
    this.ptR = { x: rx, y: this.mod(-negRy, this.p) };
    this.valR.textContent = `(${this.ptR.x}, ${this.ptR.y})`;

    this.animationPhase = 'REFLECT';
    this.renderCanvas();
    this.logMath(`Reflect across x-axis: y₃ = -(-y₃) mod p`);

    yield;

    this.animationPhase = 'DONE';
    this.renderCanvas();
    this.logMath(`Result R = (${this.ptR.x}, ${this.ptR.y})`, 'hl-emerald');
  }

  logMath(text, className = '') {
    const div = document.createElement('div');
    div.className = `math-line ${className}`;
    div.textContent = text;
    this.mathStream.appendChild(div);
    this.mathStream.scrollTop = this.mathStream.scrollHeight;
  }

  startScalarMult() {
    this.ptR = null;
    this.ptNegR = null;
    this.slopeM = null;
    this.animationPhase = 'IDLE';
    this.lineProgress = 0;

    let k = parseInt(this.inputK.value);
    if (isNaN(k) || k < 1) {
      this.logMath('Error: Invalid scalar k.');
      return;
    }

    this.generator = this.eccScalarMultGenerator(k, this.ptP);
    this.btnStep.disabled = false;
    this.btnPlay.disabled = false;

    this.startAutoPlay();
  }

  *eccScalarMultGenerator(k, P) {
    this.mathStream.innerHTML = '';
    this.logMath(`Start Scalar Multiplication: ${k} * P(${P.x}, ${P.y})`);

    if (k === 1) {
      this.ptR = P;
      this.valR.textContent = `(${P.x}, ${P.y})`;
      this.animationPhase = 'DONE';
      this.renderCanvas();
      this.logMath(`Result is P itself: (${P.x}, ${P.y})`, 'hl-emerald');
      return;
    }

    let currPt = P;
    this.ptR = P;

    for (let i = 2; i <= k; i++) {
      this.logMath(
        `Step ${i - 1}: Add P(${P.x}, ${P.y}) to current sum (${currPt.x}, ${currPt.y})`
      );

      if (currPt.x === P.x && currPt.y === this.mod(-P.y, this.p)) {
        this.ptNegR = null;
        this.ptR = null;
        this.valR.textContent = 'O (Infinity)';
        this.logMath(`Sum is Point at Infinity O. Further multiplication remains O.`, 'hl-emerald');
        this.animationPhase = 'DONE';
        this.renderCanvas();
        return;
      }

      let num, den;
      if (currPt.x === P.x && currPt.y === P.y) {
        num = this.mod(3 * Math.pow(currPt.x, 2) + this.a, this.p);
        den = this.mod(2 * currPt.y, this.p);
      } else {
        num = this.mod(P.y - currPt.y, this.p);
        den = this.mod(P.x - currPt.x, this.p);
      }

      let invDen = this.modInverse(den, this.p);
      if (invDen === null) {
        this.ptR = null;
        this.animationPhase = 'DONE';
        this.renderCanvas();
        this.logMath(
          `Denominator ${den} has no inverse. Result is Point at Infinity.`,
          'hl-emerald'
        );
        return;
      }
      this.slopeM = this.mod(num * invDen, this.p);

      let rx = this.mod(Math.pow(this.slopeM, 2) - currPt.x - P.x, this.p);
      let ry = this.mod(this.slopeM * (currPt.x - rx) - currPt.y, this.p);
      this.ptNegR = { x: rx, y: this.mod(this.slopeM * (rx - currPt.x) + currPt.y, this.p) };

      this.animationPhase = 'DRAW_LINE';
      for (let step = 0; step <= 10; step++) {
        this.lineProgress = step / 10;
        this.renderCanvas();
        yield;
      }

      this.animationPhase = 'REFLECT';
      this.ptR = { x: rx, y: ry };
      this.renderCanvas();
      yield;

      currPt = this.ptR;
      this.logMath(`Result after adding ${i} points: (${currPt.x}, ${currPt.y})`, 'hl-cyan');
    }

    this.valR.textContent = `(${currPt.x}, ${currPt.y})`;
    this.animationPhase = 'DONE';
    this.renderCanvas();
    this.logMath(`Final Result: ${k} * P = (${currPt.x}, ${currPt.y})`, 'hl-emerald');
  }

  runEcdh() {
    this.mathStream.innerHTML = '';
    let idx = this.selectGEcdh.value;
    let G = this.validPoints[idx];
    if (!G) {
      this.logMath('Error: Select a valid Generator point.');
      return;
    }

    let dA = parseInt(this.inputDA.value);
    let dB = parseInt(this.inputDB.value);
    if (isNaN(dA) || dA < 1 || isNaN(dB) || dB < 1) {
      this.logMath('Error: Private keys must be positive integers.');
      return;
    }

    this.logMath(`ECDH Key Exchange Init`);
    this.logMath(`Generator Point G = (${G.x}, ${G.y})`);

    let n = this.getPointOrder(G);
    this.logMath(`Order of G is n = ${n} (where n · G = O)`);

    this.logMath(`Alice Private Key dA = ${dA}`);
    this.logMath(`Bob Private Key dB = ${dB}`);

    let QA = this.multiplyPoint(dA, G);
    let QB = this.multiplyPoint(dB, G);

    let qaStr = QA ? `(${QA.x}, ${QA.y})` : 'O (Infinity)';
    let qbStr = QB ? `(${QB.x}, ${QB.y})` : 'O (Infinity)';

    this.resEcdhQa.textContent = qaStr;
    this.resEcdhQb.textContent = qbStr;

    this.logMath(`Alice calculates Public Key QA = dA · G = ${qaStr}`, 'hl-cyan');
    this.logMath(`Bob calculates Public Key QB = dB · G = ${qbStr}`, 'hl-cyan');

    let SA = this.multiplyPoint(dA, QB);
    let SB = this.multiplyPoint(dB, QA);

    let saStr = SA ? `(${SA.x}, ${SA.y})` : 'O (Infinity)';
    let sbStr = SB ? `(${SB.x}, ${SB.y})` : 'O (Infinity)';

    this.resEcdhSecret.textContent = saStr;

    this.logMath(`Alice computes Shared Secret SA = dA · QB = ${saStr}`);
    this.logMath(`Bob computes Shared Secret SB = dB · QA = ${sbStr}`);

    if (saStr === sbStr) {
      this.logMath(`Success! Both derive identical Shared Secret: ${saStr}`, 'hl-emerald');
    } else {
      this.logMath(`Error: Shared secrets do not match.`, 'hl-cyan');
    }

    this.ecdhState = { G, QA, QB, Secret: SA };
    this.renderCanvas();
  }

  runEcdsaSign() {
    this.mathStream.innerHTML = '';
    this.resEcdsaVerifyRes.textContent = 'null';
    this.resEcdsaVerifyRes.className = '';

    let idx = this.selectGEcdsa.value;
    let G = this.validPoints[idx];
    if (!G) {
      this.logMath('Error: Select a valid Generator point.');
      return;
    }

    let d = parseInt(this.inputEcdsaD.value);
    let e = parseInt(this.inputEcdsaE.value);
    let k = parseInt(this.inputEcdsaK.value);

    if (isNaN(d) || d < 1 || isNaN(e) || e < 1 || isNaN(k) || k < 1) {
      this.logMath('Error: All input parameters must be positive integers.');
      return;
    }

    this.logMath(`ECDSA Signature Generation`);
    this.logMath(`Generator Point G = (${G.x}, ${G.y})`);

    let n = this.getPointOrder(G);
    this.logMath(`Order of G is n = ${n}`);

    if (d >= n) {
      this.logMath(`Warning: Private Key d >= n. Reducing d mod n.`);
      d = d % n;
      if (d === 0) d = 1;
    }

    let Q = this.multiplyPoint(d, G);
    let qStr = Q ? `(${Q.x}, ${Q.y})` : 'O (Infinity)';
    this.resEcdsaQ.textContent = qStr;
    this.logMath(`Public Key Q = d · G = ${qStr}`, 'hl-cyan');

    if (k >= n) {
      this.logMath(`Warning: Nonce k >= n. Reducing k mod n.`);
      k = k % n;
      if (k === 0) k = 1;
    }

    let gcdK = (a, b) => (b === 0 ? a : gcdK(b, a % b));
    if (gcdK(k, n) !== 1) {
      this.logMath(
        `Error: Nonce k = ${k} is not coprime to order n = ${n}. gcd(k, n) = ${gcdK(k, n)}. Please choose a different nonce k.`,
        'hl-cyan'
      );
      this.resEcdsaSig.textContent = 'Error: gcd(k, n) != 1';
      return;
    }

    let R = this.multiplyPoint(k, G);
    if (!R) {
      this.logMath(`Error: k · G is Point at Infinity. Choose a different nonce k.`);
      return;
    }
    this.logMath(`1. Compute ephemeral point R = k · G = (${R.x}, ${R.y})`);

    let r = R.x % n;
    if (r === 0) {
      this.logMath(`Error: r = 0 mod n. Choose a different nonce k.`);
      return;
    }
    this.logMath(`2. Compute r = x_R mod n = ${R.x} mod ${n} = ${r}`);

    let invK = this.modInverse(k, n);
    if (invK === null) {
      this.logMath(`Error: k has no modular inverse modulo n.`);
      return;
    }
    let s = this.mod(invK * (e + r * d), n);
    if (s === 0) {
      this.logMath(`Error: s = 0. Choose a different message or nonce.`);
      return;
    }

    this.resEcdsaSig.textContent = `(r: ${r}, s: ${s})`;
    this.logMath(`3. Compute s = k⁻¹ · (e + r · d) mod n`);
    this.logMath(`   invK = ${invK}, Message Hash e = ${e}`);
    this.logMath(`   s = ${invK} · (${e} + ${r} · ${d}) mod ${n} = ${s}`, 'hl-emerald');

    this.ecdsaState = { G, Q, R, r, s, e, n };
    this.renderCanvas();
  }

  runEcdsaVerify() {
    if (!this.ecdsaState) {
      this.logMath('Error: Generate a signature first before verifying.');
      return;
    }

    this.logMath(`\nECDSA Signature Verification`);
    let { G, Q, r, s, e, n } = this.ecdsaState;

    if (r <= 0 || r >= n || s <= 0 || s >= n) {
      this.resEcdsaVerifyRes.textContent = 'Rejected (Out of range)';
      this.resEcdsaVerifyRes.className = 'text-error';
      this.logMath(
        'Verification Failed: Signature parameters r or s are out of valid range [1, n-1].'
      );
      return;
    }

    let w = this.modInverse(s, n);
    if (w === null) {
      this.resEcdsaVerifyRes.textContent = 'Rejected (No inverse of s)';
      this.resEcdsaVerifyRes.className = 'text-error';
      this.logMath('Verification Failed: s has no modular inverse mod n.');
      return;
    }
    this.logMath(`1. Compute w = s⁻¹ mod n = ${s}⁻¹ mod ${n} = ${w}`);

    let u1 = this.mod(e * w, n);
    let u2 = this.mod(r * w, n);
    this.logMath(`2. Compute u₁ = e · w mod n = ${e} · ${w} mod ${n} = ${u1}`);
    this.logMath(`   Compute u₂ = r · w mod n = ${r} · ${w} mod ${n} = ${u2}`);

    let u1G = this.multiplyPoint(u1, G);
    let u2Q = this.multiplyPoint(u2, Q);
    let P = this.addPoints(u1G, u2Q);

    let pStr = P ? `(${P.x}, ${P.y})` : 'O (Infinity)';
    this.logMath(`3. Compute Point P = u₁ · G + u₂ · Q = ${pStr}`);
    if (u1G) this.logMath(`   u₁ · G = (${u1G.x}, ${u1G.y})`);
    if (u2Q) this.logMath(`   u₂ · Q = (${u2Q.x}, ${u2Q.y})`);

    if (!P) {
      this.resEcdsaVerifyRes.textContent = 'Rejected (P is Infinity)';
      this.resEcdsaVerifyRes.className = 'text-error';
      this.logMath('Verification Failed: Derived point P is the Point at Infinity.');
      return;
    }

    let xP_mod_n = P.x % n;
    this.logMath(`4. Verify: x_P mod n == r`);
    this.logMath(`   ${P.x} mod ${n} = ${xP_mod_n} vs r = ${r}`);

    if (xP_mod_n === r) {
      this.resEcdsaVerifyRes.textContent = 'Accepted (Valid Signature)';
      this.resEcdsaVerifyRes.className = 'text-success';
      this.logMath('Success! Signature is VALID.', 'hl-emerald');
      this.ecdsaState.VerifiedPoint = P;
    } else {
      this.resEcdsaVerifyRes.textContent = 'Rejected (Invalid Signature)';
      this.resEcdsaVerifyRes.className = 'text-error';
      this.logMath('Verification Failed: Signature is INVALID.', 'hl-cyan');
    }
    this.renderCanvas();
  }

  /* --- Frame Applier --- */

  stepForward() {
    if (!this.generator) return;
    const { done } = this.generator.next();
    if (done) {
      this.pauseAutoPlay();
      this.btnStep.disabled = true;
      this.btnPlay.disabled = true;
    }
  }

  startAutoPlay() {
    this.isPlaying = true;
    this.btnPlay.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';
    this.btnPlay.classList.replace('btn-primary', 'btn-accent');

    const tick = () => {
      if (!this.isPlaying) return;
      this.stepForward();
      if (this.btnStep.disabled) {
        this.pauseAutoPlay();
        return;
      }
      // Dynamic speed: Faster during line drawing phase
      let delay = this.animationPhase === 'DRAW_LINE' ? 40 : 1000;
      setTimeout(tick, delay / this.animSpeed);
    };
    tick();
  }

  pauseAutoPlay() {
    this.isPlaying = false;
    clearTimeout(this.autoPlayTimeout);
    this.btnPlay.innerHTML = '<i class="fa-solid fa-play"></i> Animate';
    this.btnPlay.classList.replace('btn-accent', 'btn-primary');
  }

  /* --- Canvas Rendering Engine --- */

  renderCanvas() {
    const w = this.canvas.width / (window.devicePixelRatio || 1);
    const h = this.canvas.height / (window.devicePixelRatio || 1);

    this.ctx.clearRect(0, 0, w, h);

    const padding = 40;
    const gridW = w - padding * 2;
    const gridH = h - padding * 2;

    // Coordinate mapping functions
    // Math coordinates: (0,0) bottom-left, (p, p) top-right
    const getX = (mathX) => padding + (mathX / (this.p - 1 || 1)) * gridW;
    const getY = (mathY) => padding + gridH - (mathY / (this.p - 1 || 1)) * gridH;

    // 1. Draw Grid
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let i = 0; i < this.p; i++) {
      let x = getX(i);
      let y = getY(i);
      this.ctx.moveTo(x, padding);
      this.ctx.lineTo(x, h - padding);
      this.ctx.moveTo(padding, y);
      this.ctx.lineTo(w - padding, y);
    }
    this.ctx.stroke();

    // Axes labels
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '10px "Fira Code"';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('0', getX(0), h - padding + 15);
    this.ctx.fillText((this.p - 1).toString(), getX(this.p - 1), h - padding + 15);
    this.ctx.textAlign = 'right';
    this.ctx.fillText((this.p - 1).toString(), padding - 10, getY(this.p - 1) + 4);

    // 2. Draw Wrapping Line (if active)
    if (
      this.animationPhase === 'DRAW_LINE' ||
      this.animationPhase === 'REFLECT' ||
      this.animationPhase === 'DONE'
    ) {
      this.ctx.save();
      this.ctx.rect(padding, padding, gridW, gridH);
      this.ctx.clip(); // Restrict line to bounding box

      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      this.ctx.lineWidth = 2;

      // To simulate "wrapping", we draw multiple continuous line segments shifted by p
      // Equation: y = m(x - P.x) + P.y + k*p
      for (let k = -this.p; k <= this.p; k++) {
        this.ctx.beginPath();
        // Draw from x=0 to x=p
        let yStart = this.slopeM * (0 - this.ptP.x) + this.ptP.y + k * this.p;

        // Apply animation progress
        let currentX = this.p * this.lineProgress;
        let currentY = this.slopeM * (currentX - this.ptP.x) + this.ptP.y + k * this.p;

        this.ctx.moveTo(getX(0), getY(yStart));
        this.ctx.lineTo(getX(currentX), getY(currentY));
        this.ctx.stroke();
      }
      this.ctx.restore();
    }

    // 3. Draw Reflection Line
    if (this.animationPhase === 'REFLECT' || this.animationPhase === 'DONE') {
      this.ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)'; // Orange dashed
      this.ctx.setLineDash([5, 5]);
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(getX(this.ptNegR.x), getY(this.ptNegR.y));
      this.ctx.lineTo(getX(this.ptR.x), getY(this.ptR.y));
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }

    // 4. Draw All Valid Points
    this.ctx.fillStyle = '#475569';
    this.validPoints.forEach((pt) => {
      this.ctx.beginPath();
      this.ctx.arc(getX(pt.x), getY(pt.y), 4, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // 5. Draw Highlighted Points
    const drawPoint = (pt, color, label, size = 7) => {
      if (!pt) return;
      const px = getX(pt.x);
      const py = getY(pt.y);
      this.ctx.beginPath();
      this.ctx.arc(px, py, size, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = color;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      this.ctx.fillStyle = '#fff';
      this.ctx.font = 'bold 12px "Inter"';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(label, px + 10, py - 10);
    };

    if (this.activeTab === 'arithmetic') {
      if (this.ptP) drawPoint(this.ptP, '#06b6d4', 'P'); // Cyan

      // If point doubling, shift label slightly to avoid overlap
      if (this.ptQ) {
        if (this.ptP.x === this.ptQ.x && this.ptP.y === this.ptQ.y) {
          drawPoint(this.ptQ, '#7c3aed', 'P=Q', 9);
        } else {
          drawPoint(this.ptQ, '#7c3aed', 'Q');
        }
      }

      if (this.ptNegR && (this.animationPhase === 'REFLECT' || this.animationPhase === 'DONE')) {
        drawPoint(this.ptNegR, '#f97316', '-R'); // Orange
      }

      if (this.ptR && this.animationPhase === 'DONE') {
        drawPoint(this.ptR, '#10b981', 'R', 9); // Emerald
      }
    } else if (this.activeTab === 'ecdh') {
      if (this.ecdhState) {
        const { G, QA, QB, Secret } = this.ecdhState;
        if (G) drawPoint(G, '#f59e0b', 'G', 8);
        if (QA) drawPoint(QA, '#06b6d4', 'QA', 8);
        if (QB) drawPoint(QB, '#7c3aed', 'QB', 8);
        if (Secret) drawPoint(Secret, '#10b981', 'Secret', 10);
      }
    } else if (this.activeTab === 'ecdsa') {
      if (this.ecdsaState) {
        const { G, Q, R, VerifiedPoint } = this.ecdsaState;
        if (G) drawPoint(G, '#f59e0b', 'G', 8);
        if (Q) drawPoint(Q, '#06b6d4', 'Q', 8);
        if (R) drawPoint(R, '#7c3aed', 'R', 8);
        if (VerifiedPoint) drawPoint(VerifiedPoint, '#10b981', 'P (Verified)', 10);
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ECCVisualizer();
});
