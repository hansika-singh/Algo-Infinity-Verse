/**
 * aes-visualizer.js
 * Client-side AES-128 step-by-step logic and visualization
 */

document.addEventListener('DOMContentLoaded', () => {
  new AESVisualizer();
});

class AESVisualizer {
  constructor() {
    this.sBox = this.getSBox();
    this.rcon = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

    this.cacheDOM();
    if (this.els.plaintext) {
      this.bindEvents();
      this.initSequence();
      this.reset();
    }
  }

  cacheDOM() {
    this.els = {
      plaintext: document.getElementById('plaintextInput'),
      key: document.getElementById('keyInput'),
      btnRandomize: document.getElementById('btnRandomize'),
      btnReset: document.getElementById('btnReset'),
      btnPrev: document.getElementById('btnPrev'),
      btnStep: document.getElementById('btnStep'),
      btnPlayPause: document.getElementById('btnPlayPause'),

      // Containers
      roundKeysContainer: document.getElementById('roundKeysContainer'),
      stateMatrixGrid: document.getElementById('stateMatrixGrid'),
      operationDetailsArea: document.getElementById('operationDetailsArea'),
      explanationText: document.getElementById('explanationText'),

      // Status markers
      currentRoundNum: document.getElementById('currentRoundNum'),
      opTitle: document.getElementById('opTitle'),
      stateStatus: document.getElementById('state-status'),

      // Progress bar steps
      progInit: document.getElementById('prog-init'),
      progSub: document.getElementById('prog-sub'),
      progShift: document.getElementById('prog-shift'),
      progMix: document.getElementById('prog-mix'),
      progXor: document.getElementById('prog-xor'),
    };
  }

  bindEvents() {
    this.els.btnRandomize.addEventListener('click', () => this.randomizeInputs());
    this.els.btnReset.addEventListener('click', () => this.reset());
    this.els.btnPrev.addEventListener('click', () => this.stepBackward());
    this.els.btnStep.addEventListener('click', () => this.stepForward());
    this.els.btnPlayPause.addEventListener('click', () => this.togglePlayPause());

    // Auto-recalculate on change
    this.els.plaintext.addEventListener('input', () => this.reset());
    this.els.key.addEventListener('input', () => this.reset());
  }

  initSequence() {
    this.stepsSequence = [];
    // Initial Setup
    this.stepsSequence.push({ round: 0, step: 'init', name: 'Plaintext State' });
    this.stepsSequence.push({ round: 0, step: 'xor', name: 'AddRoundKey (Initial)' });

    // Rounds 1-9
    for (let r = 1; r <= 9; r++) {
      this.stepsSequence.push({ round: r, step: 'sub', name: `SubBytes (Round ${r})` });
      this.stepsSequence.push({ round: r, step: 'shift', name: `ShiftRows (Round ${r})` });
      this.stepsSequence.push({ round: r, step: 'mix', name: `MixColumns (Round ${r})` });
      this.stepsSequence.push({ round: r, step: 'xor', name: `AddRoundKey (Round ${r})` });
    }

    // Round 10 (Final round, no MixColumns)
    this.stepsSequence.push({ round: 10, step: 'sub', name: 'SubBytes (Round 10)' });
    this.stepsSequence.push({ round: 10, step: 'shift', name: 'ShiftRows (Round 10)' });
    this.stepsSequence.push({ round: 10, step: 'xor', name: 'AddRoundKey (Round 10)' });

    // Completed
    this.stepsSequence.push({ round: 10, step: 'done', name: 'Ciphertext Ready' });
  }

  reset() {
    this.clearAutoplay();

    const plainVal = this.els.plaintext.value;
    const keyVal = this.els.key.value;

    this.state = {
      plaintextBytes: this.parseInput(plainVal),
      keyBytes: this.parseInput(keyVal),
      roundKeys: [],
      currentState: [],
      currentStepIndex: 0,
      stateHistory: [], // array of cloned states for back stepping
    };

    // Generate keys
    this.state.roundKeys = this.expandKeys(this.state.keyBytes);
    this.state.currentState = [...this.state.plaintextBytes];

    this.renderRoundKeys();
    this.updateUI();
  }

  randomizeInputs() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randPlain = '';
    let randKey = '';
    for (let i = 0; i < 16; i++) {
      randPlain += chars.charAt(Math.floor(Math.random() * chars.length));
      randKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.els.plaintext.value = randPlain;
    this.els.key.value = randKey;
    this.reset();
  }

  parseInput(val) {
    let bytes = [];
    const hexPattern = /^[0-9a-fA-F]{32}$/;
    const clean = val.trim();
    if (hexPattern.test(clean)) {
      for (let i = 0; i < 32; i += 2) {
        bytes.push(parseInt(clean.substr(i, 2), 16));
      }
    } else {
      for (let i = 0; i < 16; i++) {
        if (i < val.length) {
          bytes.push(val.charCodeAt(i) & 0xff);
        } else {
          bytes.push(0);
        }
      }
    }
    return bytes;
  }

  expandKeys(key) {
    const w = [];
    for (let i = 0; i < 4; i++) {
      w[i] = [key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]];
    }

    for (let i = 4; i < 44; i++) {
      let temp = [...w[i - 1]];
      if (i % 4 === 0) {
        // RotWord
        const first = temp.shift();
        temp.push(first);
        // SubWord
        temp = temp.map((b) => this.sBox[b]);
        // XOR with Rcon
        temp[0] ^= this.rcon[i / 4];
      }
      w[i] = [
        w[i - 4][0] ^ temp[0],
        w[i - 4][1] ^ temp[1],
        w[i - 4][2] ^ temp[2],
        w[i - 4][3] ^ temp[3],
      ];
    }

    const roundKeys = [];
    for (let r = 0; r < 11; r++) {
      const roundKey = [];
      for (let c = 0; c < 4; c++) {
        roundKey.push(...w[4 * r + c]);
      }
      roundKeys.push(roundKey);
    }
    return roundKeys;
  }

  galoisMultiply(a, b) {
    let p = 0;
    for (let i = 0; i < 8; i++) {
      if (b & 1) {
        p ^= a;
      }
      let hiBitSet = a & 0x80;
      a <<= 1;
      if (hiBitSet) {
        a ^= 0x1b;
      }
      b >>= 1;
    }
    return p & 0xff;
  }

  applySubBytes(state) {
    return state.map((b) => this.sBox[b]);
  }

  applyShiftRows(state) {
    const next = [...state];
    // Row 1: Shift left by 1 (indices 1, 5, 9, 13)
    next[1] = state[5];
    next[5] = state[9];
    next[9] = state[13];
    next[13] = state[1];

    // Row 2: Shift left by 2 (indices 2, 6, 10, 14)
    next[2] = state[10];
    next[6] = state[14];
    next[10] = state[2];
    next[14] = state[6];

    // Row 3: Shift left by 3 (indices 3, 7, 11, 15)
    next[3] = state[15];
    next[7] = state[3];
    next[11] = state[7];
    next[15] = state[11];

    return next;
  }

  applyMixColumns(state) {
    const next = [...state];
    for (let c = 0; c < 4; c++) {
      const s0 = state[4 * c];
      const s1 = state[4 * c + 1];
      const s2 = state[4 * c + 2];
      const s3 = state[4 * c + 3];

      next[4 * c] = this.galoisMultiply(0x02, s0) ^ this.galoisMultiply(0x03, s1) ^ s2 ^ s3;
      next[4 * c + 1] = s0 ^ this.galoisMultiply(0x02, s1) ^ this.galoisMultiply(0x03, s2) ^ s3;
      next[4 * c + 2] = s0 ^ s1 ^ this.galoisMultiply(0x02, s2) ^ this.galoisMultiply(0x03, s3);
      next[4 * c + 3] = this.galoisMultiply(0x03, s0) ^ s1 ^ s2 ^ this.galoisMultiply(0x02, s3);
    }
    return next;
  }

  applyAddRoundKey(state, rKey) {
    const next = [];
    for (let i = 0; i < 16; i++) {
      next.push(state[i] ^ rKey[i]);
    }
    return next;
  }

  stepForward() {
    if (this.state.currentStepIndex >= this.stepsSequence.length - 1) return;

    const nextStep = this.stepsSequence[this.state.currentStepIndex + 1];

    // Save history
    this.state.stateHistory.push({
      state: [...this.state.currentState],
      stepIndex: this.state.currentStepIndex,
    });

    // Compute transition
    if (nextStep.step === 'sub') {
      this.state.currentState = this.applySubBytes(this.state.currentState);
    } else if (nextStep.step === 'shift') {
      this.state.currentState = this.applyShiftRows(this.state.currentState);
    } else if (nextStep.step === 'mix') {
      this.state.currentState = this.applyMixColumns(this.state.currentState);
    } else if (nextStep.step === 'xor') {
      this.state.currentState = this.applyAddRoundKey(
        this.state.currentState,
        this.state.roundKeys[nextStep.round]
      );
    }

    this.state.currentStepIndex++;
    this.updateUI();
  }

  stepBackward() {
    if (this.state.stateHistory.length === 0) return;

    const previous = this.state.stateHistory.pop();
    this.state.currentState = previous.state;
    this.state.currentStepIndex = previous.stepIndex;

    this.updateUI();
  }

  togglePlayPause() {
    if (this.autoplayInterval) {
      this.clearAutoplay();
    } else {
      this.els.btnPlayPause.innerHTML = '<i class="fas fa-pause"></i> Pause';
      this.els.btnPlayPause.className = 'btn btn-accent';
      this.autoplayInterval = setInterval(() => {
        if (this.state.currentStepIndex >= this.stepsSequence.length - 1) {
          this.clearAutoplay();
          return;
        }
        this.stepForward();
      }, 1200);
    }
  }

  clearAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
    if (this.els.btnPlayPause) {
      this.els.btnPlayPause.innerHTML = '<i class="fas fa-play"></i> Auto Play';
    }
  }

  updateUI() {
    const currentStep = this.stepsSequence[this.state.currentStepIndex];

    // Update buttons
    this.els.btnPrev.disabled = this.state.stateHistory.length === 0;
    this.els.btnStep.disabled = this.state.currentStepIndex >= this.stepsSequence.length - 1;

    // Headings
    this.els.currentRoundNum.textContent = currentStep.round;
    this.els.opTitle.textContent = currentStep.name;

    // Highlight key expansion active card
    const keyCards = this.els.roundKeysContainer.querySelectorAll('.round-key-card');
    keyCards.forEach((card, idx) => {
      if (idx === currentStep.round) {
        card.classList.add('active');
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        card.classList.remove('active');
      }
    });

    // Update Status Steps Timeline indicator
    const steps = ['init', 'sub', 'shift', 'mix', 'xor'];
    steps.forEach((st) => {
      const el = document.getElementById(`prog-${st}`);
      if (!el) return;
      el.className = 'progress-step';
      if (currentStep.round === 10 && st === 'mix') return;
      if (st === currentStep.step) {
        el.classList.add('active');
      } else {
        const currentIdx = steps.indexOf(currentStep.step);
        const stIdx = steps.indexOf(st);
        if (currentIdx > stIdx || currentStep.step === 'done') {
          el.classList.add('completed');
        }
      }
    });

    // Render 4x4 matrix
    this.renderStateMatrix(currentStep.step);

    // Render operation details & explanation
    this.renderOperationDetails(currentStep);
  }

  renderStateMatrix(stepType) {
    this.els.stateMatrixGrid.innerHTML = '';
    // Display in column-major order
    // Elements of matrix: index in list is c*4 + r (column major)
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const idx = c * 4 + r;
        const val = this.state.currentState[idx];
        const hex = val.toString(16).padStart(2, '0').toUpperCase();
        const char = val >= 32 && val <= 126 ? String.fromCharCode(val) : '.';

        const cell = document.createElement('div');
        cell.className = 'matrix-cell';

        // Highlights based on operation step
        if (stepType === 'sub') cell.classList.add('highlight-sub');
        else if (stepType === 'shift' && r > 0) cell.classList.add('highlight-shift');
        else if (stepType === 'mix') cell.classList.add('highlight-mix');
        else if (stepType === 'xor') cell.classList.add('highlight-xor');

        cell.innerHTML = `
          <span class="cell-hex">${hex}</span>
          <span class="cell-info">'${char}' [${idx}]</span>
        `;
        this.els.stateMatrixGrid.appendChild(cell);
      }
    }
  }

  renderRoundKeys() {
    this.els.roundKeysContainer.innerHTML = '';
    this.state.roundKeys.forEach((key, roundIdx) => {
      const card = document.createElement('div');
      card.className = 'round-key-card';
      card.innerHTML = `<h4>Round ${roundIdx}</h4>`;

      const grid = document.createElement('div');
      grid.className = 'round-key-grid';
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const idx = c * 4 + r;
          const hex = key[idx].toString(16).padStart(2, '0').toUpperCase();
          grid.innerHTML += `<div class="key-byte-cell">${hex}</div>`;
        }
      }
      card.appendChild(grid);
      card.addEventListener('click', () => {
        // Find first step of this round and jump
        const targetStepIdx = this.stepsSequence.findIndex((s) => s.round === roundIdx);
        if (targetStepIdx !== -1) {
          this.state.stateHistory = Array.from({ length: targetStepIdx }, (_, stepIndex) => ({
            state: this.recomputeStateTo(stepIndex),
            stepIndex,
          }));
          this.state.currentStepIndex = targetStepIdx;
          this.state.currentState = this.recomputeStateTo(targetStepIdx);
          this.updateUI();
        }
      });
      this.els.roundKeysContainer.appendChild(card);
    });
  }

  recomputeStateTo(stepIndex) {
    let tempState = [...this.state.plaintextBytes];
    for (let i = 1; i <= stepIndex; i++) {
      const stepInfo = this.stepsSequence[i];
      if (stepInfo.step === 'sub') {
        tempState = this.applySubBytes(tempState);
      } else if (stepInfo.step === 'shift') {
        tempState = this.applyShiftRows(tempState);
      } else if (stepInfo.step === 'mix') {
        tempState = this.applyMixColumns(tempState);
      } else if (stepInfo.step === 'xor') {
        tempState = this.applyAddRoundKey(tempState, this.state.roundKeys[stepInfo.round]);
      }
    }
    return tempState;
  }

  renderOperationDetails(currentStep) {
    const area = this.els.operationDetailsArea;
    const expl = this.els.explanationText;
    area.innerHTML = '';

    if (currentStep.step === 'init') {
      area.innerHTML = `
        <div class="sub-bytes-detail">
          <p>This is the initial state of the Plaintext before any transformation has begun.</p>
          <div class="sbox-lookup-visual">
            <div class="sbox-step">
              <span>Plaintext ASCII</span>
              <strong>${this.els.plaintext.value.substr(0, 16)}</strong>
            </div>
          </div>
        </div>
      `;
      expl.innerHTML = `
        <p>AES encrypts data in fixed 128-bit blocks (16 bytes). These 16 bytes are arranged in a 4×4 grid in a column-major order:
        the first column contains bytes 0–3, the second contains bytes 4–7, and so on.</p>
        <p>The Master Cipher Key is also expanded using the AES Key Expansion algorithm to yield 11 Round Keys, which will be XORed into the State Matrix at the end of each round.</p>
      `;
    } else if (currentStep.step === 'sub') {
      // Pick a sample cell for detail illustration
      const sampleIdx = 0;
      const originalVal =
        this.state.stateHistory[this.state.stateHistory.length - 1].state[sampleIdx];
      const replacedVal = this.state.currentState[sampleIdx];

      area.innerHTML = `
        <div class="sub-bytes-detail">
          <p>Each byte in the state is replaced with its entry in the non-linear S-box.</p>
          <div class="sbox-lookup-visual">
            <div class="sbox-step">
              <span>Input Byte [Cell 0]</span>
              <strong>0x${originalVal.toString(16).toUpperCase().padStart(2, '0')}</strong>
            </div>
            <div class="math-symbol"><i class="fas fa-arrow-right"></i></div>
            <div class="sbox-step">
              <span>S-Box Lookup</span>
              <strong>S-Box[0x${originalVal.toString(16).toUpperCase().padStart(2, '0')}]</strong>
            </div>
            <div class="math-symbol"><i class="fas fa-arrow-right"></i></div>
            <div class="sbox-step">
              <span>Output Byte</span>
              <strong>0x${replacedVal.toString(16).toUpperCase().padStart(2, '0')}</strong>
            </div>
          </div>
        </div>
      `;
      expl.innerHTML = `
        <p><strong>SubBytes</strong> is a non-linear substitution step where each byte is replaced with another byte using a lookup table called the <strong>Rijndael S-box</strong>.</p>
        <p>This operation provides <em>confusion</em> in the cipher, making the relationship between the plaintext/key and the ciphertext mathematically complex and resistant to linear cryptanalysis.</p>
      `;
    } else if (currentStep.step === 'shift') {
      area.innerHTML = `
        <div class="sub-bytes-detail">
          <p>The rows of the State Matrix are cyclically shifted to the left by offsets of 0, 1, 2, and 3 bytes respectively.</p>
          <div class="op-details-grid">
            <div class="op-mini-grid">
              <div class="op-mini-cell">Row 0</div><div class="op-mini-cell">←0</div><div class="op-mini-cell">←0</div><div class="op-mini-cell">←0</div>
              <div class="op-mini-cell">Row 1</div><div class="op-mini-cell highlight">←1</div><div class="op-mini-cell">←1</div><div class="op-mini-cell">←1</div>
              <div class="op-mini-cell">Row 2</div><div class="op-mini-cell">←2</div><div class="op-mini-cell highlight">←2</div><div class="op-mini-cell">←2</div>
              <div class="op-mini-cell">Row 3</div><div class="op-mini-cell">←3</div><div class="op-mini-cell">←3</div><div class="op-mini-cell highlight">←3</div>
            </div>
            <div class="math-symbol"><i class="fas fa-arrow-right"></i></div>
            <div>
              <ul>
                <li>Row 0: Shifted by 0</li>
                <li>Row 1: Shifted by 1</li>
                <li>Row 2: Shifted by 2</li>
                <li>Row 3: Shifted by 3</li>
              </ul>
            </div>
          </div>
        </div>
      `;
      expl.innerHTML = `
        <p><strong>ShiftRows</strong> operates on the rows of the state; it cyclically shifts the bytes in each row by a certain offset.</p>
        <p>This transposition step ensures that the columns are mixed together. Together with <code>MixColumns</code>, it provides <em>diffusion</em>, meaning changes to a single plaintext byte spread across the entire block over several rounds.</p>
      `;
    } else if (currentStep.step === 'mix') {
      area.innerHTML = `
        <div class="sub-bytes-detail">
          <p>Each column is multiplied by a fixed polynomial matrix in Galois Field <code>GF(2^8)</code>.</p>
          <table class="gf-math-table">
            <thead>
              <tr>
                <th>Fixed Matrix</th>
                <th></th>
                <th>Input Col</th>
                <th></th>
                <th>Output Col</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>[02 03 01 01]</td>
                <td>x</td>
                <td>[s<sub>0</sub>]</td>
                <td>=</td>
                <td>[(2•s<sub>0</sub>) ⊕ (3•s<sub>1</sub>) ⊕ s<sub>2</sub> ⊕ s<sub>3</sub>]</td>
              </tr>
              <tr>
                <td>[01 02 03 01]</td>
                <td>x</td>
                <td>[s<sub>1</sub>]</td>
                <td>=</td>
                <td>[s<sub>0</sub> ⊕ (2•s<sub>1</sub>) ⊕ (3•s<sub>2</sub>) ⊕ s<sub>3</sub>]</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      expl.innerHTML = `
        <p><strong>MixColumns</strong> treats each column of the state matrix as a four-term polynomial over $GF(2^8)$ and multiplies it modulo $x^4 + 1$ with a fixed polynomial $a(x) = 3x^3 + x^2 + x + 2$.</p>
        <p>This mixes the 4 bytes of each column to ensure high diffusion. MixColumns is omitted in the final Round 10 because it does not improve security at the very end and would slow down decryption operations.</p>
      `;
    } else if (currentStep.step === 'xor') {
      const keyBytes = this.state.roundKeys[currentStep.round];
      const sampleStateVal = this.state.currentState[0];
      const sampleKeyVal = keyBytes[0];
      const originalStateVal = this.state.stateHistory[this.state.stateHistory.length - 1].state[0];

      area.innerHTML = `
        <div class="sub-bytes-detail">
          <p>Combine the State Matrix with the Round Key using a bitwise XOR (exclusive OR) operation.</p>
          <div class="sbox-lookup-visual">
            <div class="sbox-step">
              <span>State Cell 0</span>
              <strong>0x${originalStateVal.toString(16).toUpperCase().padStart(2, '0')}</strong>
            </div>
            <div class="math-symbol">⊕</div>
            <div class="sbox-step">
              <span>Round Key Cell 0</span>
              <strong>0x${sampleKeyVal.toString(16).toUpperCase().padStart(2, '0')}</strong>
            </div>
            <div class="math-symbol">=</div>
            <div class="sbox-step">
              <span>New State Cell 0</span>
              <strong>0x${sampleStateVal.toString(16).toUpperCase().padStart(2, '0')}</strong>
            </div>
          </div>
        </div>
      `;
      expl.innerHTML = `
        <p><strong>AddRoundKey</strong> combines the state matrix with the subkey (Round Key) generated during Key Expansion. The subkey is added to the state byte-by-byte using the bitwise XOR operation.</p>
        <p>This is the operation that incorporates the secret key material directly into the state block, ensuring that the cipher cannot be decrypted without the correct key.</p>
      `;
    } else if (currentStep.step === 'done') {
      const ciphertextHex = this.state.currentState
        .map((b) => b.toString(16).toUpperCase().padStart(2, '0'))
        .join('');
      area.innerHTML = `
        <div class="sub-bytes-detail">
          <p>Encryption Rounds Complete! Here is the final ciphertext in Hexadecimal format.</p>
          <div class="final-hash-container">
            <div class="final-hash">${ciphertextHex}</div>
          </div>
        </div>
      `;
      expl.innerHTML = `
        <p>The AES-128 encryption algorithm has successfully completed all 10 rounds of transformation.</p>
        <p>The plaintext block has been securely converted into an unreadable ciphertext. To decrypt it, the recipient would run the inverse transformations (InvSubBytes, InvShiftRows, InvMixColumns, and AddRoundKey) in reverse order using the same Cipher Key.</p>
      `;
    }
  }

  getSBox() {
    return [
      0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab,
      0x76, 0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4,
      0x72, 0xc0, 0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71,
      0xd8, 0x31, 0x15, 0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2,
      0xeb, 0x27, 0xb2, 0x75, 0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6,
      0xb3, 0x29, 0xe3, 0x2f, 0x84, 0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb,
      0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf, 0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45,
      0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8, 0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5,
      0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2, 0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44,
      0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73, 0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a,
      0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb, 0xe0, 0x32, 0x3a, 0x0a, 0x49,
      0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79, 0xe7, 0xc8, 0x37, 0x6d,
      0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08, 0xba, 0x78, 0x25,
      0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a, 0x70, 0x3e,
      0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e, 0xe1,
      0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
      0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb,
      0x16,
    ];
  }
}

if (typeof window !== 'undefined') {
  window.AESVisualizer = AESVisualizer;
}
