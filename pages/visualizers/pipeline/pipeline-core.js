/* ============================================================
   CPU Pipeline Simulator — pure core logic (no DOM)
   5-stage in-order pipeline: IF, ID, EX, MEM, WB
   No forwarding (register file: write-first-half, read-second-half
   of the same cycle, matching the classic MIPS textbook convention
   — a producer in WB this cycle unblocks a consumer in ID this
   same cycle; a producer still in EX or MEM blocks it).
   ============================================================ */

const STAGES = ["IF", "ID", "EX", "MEM", "WB"];

/* ---------- assembler ---------- */

function parseProgram(text){
  const lines = text.split("\n")
    .map(l => l.split(";")[0].trim())
    .filter(l => l.length > 0);

  const labels = new Map();
  const raw = [];
  for(const line of lines){
    const labelMatch = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    let rest = line;
    if(labelMatch){
      labels.set(labelMatch[1], raw.length);
      rest = labelMatch[2].trim();
      if(rest.length === 0) continue;
    }
    raw.push(rest);
  }

  const instrs = raw.map((line, idx) => {
    const parts = line.replace(/,/g, " ").split(/\s+/).filter(Boolean);
    const op = parts[0].toUpperCase();
    const args = parts.slice(1);
    const isBranch = op === "BEQ" || op === "BNE";
    const isJump = op === "J";
    let dst = null, srcs = [], target = null, imm = null;

    if(op === "ADD" || op === "SUB"){
      dst = args[0]; srcs = [args[1], args[2]];
    } else if(op === "ADDI"){
      dst = args[0]; srcs = [args[1]]; imm = parseInt(args[2], 10);
    } else if(op === "LW"){
      dst = args[0];
      const m = args[1].match(/^(-?\d+)\(([A-Za-z0-9_]+)\)$/);
      imm = m ? parseInt(m[1], 10) : 0;
      const base = m ? m[2] : args[1];
      srcs = [base];
    } else if(op === "SW"){
      const m = args[1].match(/^(-?\d+)\(([A-Za-z0-9_]+)\)$/);
      imm = m ? parseInt(m[1], 10) : 0;
      const base = m ? m[2] : args[1];
      srcs = [args[0], base];
    } else if(isBranch){
      srcs = [args[0], args[1]]; target = args[2];
    } else if(isJump){
      target = args[0];
    } else if(op === "NOOP" || op === "NOP"){
      // no operands
    } else {
      throw new Error(`Unknown opcode "${op}" on line ${idx + 1}: "${line}"`);
    }

    return { staticIdx: idx, op, dst, srcs, imm, target, isBranch, isJump, text: line };
  });

  instrs.forEach(instr => {
    if(instr.target !== null){
      if(!labels.has(instr.target)) throw new Error(`Unknown label "${instr.target}" in "${instr.text}"`);
      instr.targetIdx = labels.get(instr.target);
    }
  });

  return { instrs, labels };
}

/* ---------- branch predictor (2-bit saturating counter, per static PC) ---------- */

const PREDICTOR_STATES = ["Strongly Not Taken", "Weakly Not Taken", "Weakly Taken", "Strongly Taken"];
function predictTaken(state){ return state >= 2; }
function updatePredictor(state, actualTaken){
  if(actualTaken) return Math.min(3, state + 1);
  return Math.max(0, state - 1);
}

/* ---------- pipeline simulation ---------- */

function simulate(programText, initialRegs, options = {}){
  const maxDynamic = options.maxDynamic || 200;
  const maxCycles = options.maxCycles || 3000;
  const initialPredictorState = options.initialPredictorState !== undefined ? options.initialPredictorState : 1;

  const { instrs } = parseProgram(programText);
  const regs = { R0: 0, ...initialRegs };
  const predictor = new Map(); // staticIdx -> state (0..3)

  let pc = 0;
  let instanceSeq = 0;
  const instances = new Map();
  const flushEvents = [];
  const predictorLog = [];
  let retiredCount = 0;
  let cycle = 0;
  let halted = false;

  function makeInstance(){
    if(pc >= instrs.length) return null;
    const s = instrs[pc];
    const inst = {
      id: instanceSeq++, staticIdx: s.staticIdx, op: s.op, dst: s.dst, srcs: s.srcs, imm: s.imm,
      isBranch: s.isBranch, isJump: s.isJump, targetIdx: s.targetIdx, text: s.text,
      timeline: {}, flushed: false, predictedTaken: null, actualTaken: null,
    };
    if(s.isBranch){
      if(!predictor.has(s.staticIdx)) predictor.set(s.staticIdx, initialPredictorState);
      inst.predictedTaken = predictTaken(predictor.get(s.staticIdx));
    }
    instances.set(inst.id, inst);
    if(s.isJump) pc = s.targetIdx;
    else if(s.isBranch) pc = inst.predictedTaken ? s.targetIdx : pc + 1;
    else pc = pc + 1;
    return inst;
  }

  // Prime the first fetch so instruction 0's IF is recorded at cycle 1, not cycle 2.
  let pipeline = { IF: makeInstance(), ID: null, EX: null, MEM: null, WB: null };

  while(retiredCount < maxDynamic && cycle < maxCycles && !halted){
    cycle++;
    const events = [];

    // Snapshot: record which stage everyone currently occupies THIS cycle.
    for(const st of STAGES){
      const inst = pipeline[st];
      if(inst) inst.timeline[cycle] = st;
    }

    const next = { IF: null, ID: null, EX: null, MEM: null, WB: null };

    // --- WB: retire (register write happens "first half" of this cycle) ---
    if(pipeline.WB){
      const inst = pipeline.WB;
      if(inst.dst && inst.dst !== "R0") regs[inst.dst] = inst.computedValue;
      retiredCount++;
      events.push({ type: "retire", id: inst.id });
    }

    // --- MEM -> WB (always advances) ---
    next.WB = pipeline.MEM;

    // --- EX -> MEM, with branch resolution ---
    next.MEM = pipeline.EX;
    let flushedThisCycle = false;
    if(pipeline.EX){
      const inst = pipeline.EX;
      const val = (name) => (name !== undefined && regs[name] !== undefined) ? regs[name] : 0;
      if(inst.op === "ADD") inst.computedValue = val(inst.srcs[0]) + val(inst.srcs[1]);
      else if(inst.op === "SUB") inst.computedValue = val(inst.srcs[0]) - val(inst.srcs[1]);
      else if(inst.op === "ADDI") inst.computedValue = val(inst.srcs[0]) + inst.imm;
      else if(inst.op === "LW") inst.computedValue = 0; // simplified memory model

      if(inst.isBranch){
        const eq = val(inst.srcs[0]) === val(inst.srcs[1]);
        const actualTaken = inst.op === "BEQ" ? eq : !eq;
        inst.actualTaken = actualTaken;
        const staticIdx = inst.staticIdx;
        const before = predictor.get(staticIdx);
        const after = updatePredictor(before, actualTaken);
        predictor.set(staticIdx, after);
        const mispredicted = inst.predictedTaken !== actualTaken;
        predictorLog.push({ cycle, staticIdx, stateBefore: before, stateAfter: after, predicted: inst.predictedTaken, actual: actualTaken, mispredicted });

        if(mispredicted){
          flushedThisCycle = true;
          const flushedIds = [];
          if(pipeline.ID && !pipeline.ID.flushed){
            pipeline.ID.flushed = true;
            pipeline.ID.timeline[cycle] = "ID-FLUSH";
            flushedIds.push(pipeline.ID.id);
          }
          if(pipeline.IF && !pipeline.IF.flushed){
            pipeline.IF.flushed = true;
            pipeline.IF.timeline[cycle] = "IF-FLUSH";
            flushedIds.push(pipeline.IF.id);
          }
          flushEvents.push({ cycle, branchStaticIdx: staticIdx, flushedIds, penaltyCycles: flushedIds.length });
          events.push({ type: "flush", flushedIds, branchId: inst.id });
          pc = actualTaken ? inst.targetIdx : inst.staticIdx + 1;
        }
      }
    }

    // --- ID -> EX, with data-hazard stall check ---
    let stallIF = false;
    if(pipeline.ID && !pipeline.ID.flushed){
      const inst = pipeline.ID;
      const pending = new Set();
      if(pipeline.EX && pipeline.EX.dst && pipeline.EX.dst !== "R0") pending.add(pipeline.EX.dst);
      if(pipeline.MEM && pipeline.MEM.dst && pipeline.MEM.dst !== "R0") pending.add(pipeline.MEM.dst);
      const hazard = inst.srcs.some(s => s !== undefined && pending.has(s));
      if(hazard){
        stallIF = true;
        next.ID = inst;
        events.push({ type: "stall", id: inst.id });
      } else {
        next.EX = inst;
      }
    }

    // --- IF -> ID, and fetch ---
    if(flushedThisCycle){
      next.ID = null;
      next.IF = null;
    } else if(!stallIF){
      if(pipeline.IF && !pipeline.IF.flushed) next.ID = pipeline.IF;
      next.IF = makeInstance();
    } else {
      next.IF = pipeline.IF; // held; re-snapshotted (still "IF") at the top of next cycle
    }

    pipeline = next;

    const stillInFlight = pipeline.IF || pipeline.ID || pipeline.EX || pipeline.MEM || pipeline.WB;
    if(pc >= instrs.length && !stillInFlight) halted = true;
  }

  return { instrs, instances, flushEvents, predictorLog, finalRegs: regs, totalCycles: cycle, retiredCount };
}

if(typeof module !== "undefined"){
  module.exports = { parseProgram, simulate, predictTaken, updatePredictor, PREDICTOR_STATES, STAGES };
}
