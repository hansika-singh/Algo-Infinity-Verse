document.addEventListener('DOMContentLoaded', function () {
  lshInit();
});

var lshK = 8;
var lshB = 4;
var lshDocs = [];
var lshDocCounter = 0;
var lshSelectedDoc = -1;

var LSH_BAND_COLOURS = ['#7c3aed','#06b6d4','#f59e0b','#ef4444','#22c55e','#ec4899','#fb923c','#6366f1'];

var LSH_PRESET_DOCS = [
  'the quick brown fox jumps over the lazy dog',
  'the quick brown fox leaps over a lazy dog',
  'machine learning is a subset of artificial intelligence',
  'deep learning is a subset of machine learning and artificial intelligence',
  'javascript is a programming language for the web',
  'typescript is a typed superset of javascript for the web',
  'the cat sat on the mat and looked around',
  'a cat was sitting on the mat looking around'
];

/* ── Shingling ── */
function lshShingle(text, q) {
  q = q || 2;
  var words = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
  var shingles = new Set();
  for (var i = 0; i <= words.length - q; i++) {
    shingles.add(words.slice(i, i + q).join(' '));
  }
  if (shingles.size === 0) {
    words.forEach(function (w) { shingles.add(w); });
  }
  return shingles;
}

/* ── Jaccard ── */
function lshJaccard(setA, setB) {
  var intersection = 0;
  setA.forEach(function (s) { if (setB.has(s)) intersection++; });
  var union = setA.size + setB.size - intersection;
  if (union === 0) return 0;
  return intersection / union;
}

/* ── Stable polynomial hash ── */
function lshPolyHash(str, seed) {
  var h = seed >>> 0;
  for (var i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x9e3779b9);
    h = ((h << 13) | (h >>> 19)) >>> 0;
  }
  return h;
}

/* ── MinHash signature ── */
function lshMinHashSig(shingles, k) {
  var sig = [];
  var shingleArr = Array.from(shingles);

  for (var r = 0; r < k; r++) {
    var minVal = 0xFFFFFFFF;
    for (var j = 0; j < shingleArr.length; j++) {
      var h = lshPolyHash(shingleArr[j], 1000003 + r * 999983);
      if (h < minVal) minVal = h;
    }
    sig.push(minVal);
  }
  return sig;
}

/* ── Band hashing ── */
function lshBandHash(sig, bandIdx, rowsPerBand) {
  var start = bandIdx * rowsPerBand;
  var slice = sig.slice(start, start + rowsPerBand);
  var h = 0;
  slice.forEach(function (v, i) {
    h = (Math.imul(h ^ v, 0x9e3779b9) + i * 31) >>> 0;
  });
  return h;
}

/* ── Build buckets ── */
function lshBuildBuckets() {
  var rowsPerBand = Math.max(1, Math.floor(lshK / lshB));
  var bands = [];

  for (var b = 0; b < lshB; b++) {
    var bucket = {};
    lshDocs.forEach(function (doc) {
      var h = lshBandHash(doc.sig, b, rowsPerBand);
      var key = h.toString(16).slice(0, 6);
      if (!bucket[key]) bucket[key] = [];
      bucket[key].push(doc.id);
    });
    bands.push(bucket);
  }
  return bands;
}

/* ── Get candidate pairs ── */
function lshGetCandidates(bands) {
  var seen = new Set();
  var pairs = [];

  bands.forEach(function (bucket) {
    Object.values(bucket).forEach(function (docIds) {
      if (docIds.length < 2) return;
      for (var i = 0; i < docIds.length; i++) {
        for (var j = i + 1; j < docIds.length; j++) {
          var key = Math.min(docIds[i], docIds[j]) + '_' + Math.max(docIds[i], docIds[j]);
          if (!seen.has(key)) {
            seen.add(key);
            pairs.push([docIds[i], docIds[j]]);
          }
        }
      }
    });
  });

  return pairs;
}

/* ── Recompute all doc signatures after params change ── */
function lshRecomputeAll() {
  lshDocs.forEach(function (doc) {
    doc.sig = lshMinHashSig(doc.shingles, lshK);
  });
}

/* ── Rendering: document list ── */
function lshRenderDocList() {
  var el = document.getElementById('lshDocList');
  if (!el) return;

  if (!lshDocs.length) {
    el.innerHTML = '<span class="lsh-empty-text">No documents added yet.</span>';
    return;
  }

  el.innerHTML = lshDocs.map(function (doc) {
    var sel = doc.id === lshSelectedDoc ? ' selected' : '';
    var shinglePreview = Array.from(doc.shingles).slice(0, 3).join(', ') + (doc.shingles.size > 3 ? '…' : '');
    return (
      '<div class="lsh-doc-item' + sel + '" data-id="' + doc.id + '">' +
        '<div class="lsh-doc-id">Doc ' + doc.id + ' (' + doc.shingles.size + ' shingles)</div>' +
        '<div class="lsh-doc-text">' + lshEscape(doc.text) + '</div>' +
        '<div class="lsh-doc-shingles">' + lshEscape(shinglePreview) + '</div>' +
      '</div>'
    );
  }).join('');

  el.querySelectorAll('.lsh-doc-item').forEach(function (item) {
    item.addEventListener('click', function () {
      lshSelectedDoc = parseInt(item.getAttribute('data-id'), 10);
      lshRenderAll();
      lshShowResults();
    });
  });
}

/* ── Rendering: signature table ── */
function lshRenderSignatures(highlightDocId) {
  var el = document.getElementById('lshSigArea');
  if (!el) return;

  if (!lshDocs.length) {
    el.innerHTML = '<span class="lsh-empty-text">Signatures appear here after adding documents.</span>';
    return;
  }

  var rowsPerBand = Math.max(1, Math.floor(lshK / lshB));

  var html = '<table class="lsh-sig-table"><thead><tr><th class="lsh-sig-th">Doc</th>';
  for (var h = 0; h < lshK; h++) {
    html += '<th class="lsh-sig-th">h' + (h + 1) + '</th>';
  }
  html += '</tr></thead><tbody>';

  lshDocs.forEach(function (doc) {
    var isHl = doc.id === highlightDocId;
    html += '<tr><td class="lsh-sig-td-label">' + (isHl ? '▶ ' : '') + 'D' + doc.id + '</td>';

    doc.sig.forEach(function (val, idx) {
      var bandIdx = Math.floor(idx / rowsPerBand);
      var bandClass = isHl ? ' lsh-cell-hi' : (' lsh-cell-band-' + (bandIdx % LSH_BAND_COLOURS.length));
      var display = (val >>> 0).toString(16).slice(0, 4);
      html += '<td class="lsh-sig-cell' + bandClass + '">' + display + '</td>';
    });

    html += '</tr>';
  });

  html += '</tbody></table>';
  el.innerHTML = html;
}

/* ── Rendering: band buckets ── */
function lshRenderBands(bands) {
  var el = document.getElementById('lshBandArea');
  if (!el) return;

  if (!bands || !lshDocs.length) {
    el.innerHTML = '<span class="lsh-empty-text">Band buckets appear here.</span>';
    return;
  }

  var html = '';

  bands.forEach(function (bucket, bIdx) {
    var colour = LSH_BAND_COLOURS[bIdx % LSH_BAND_COLOURS.length];
    html += '<div class="lsh-band-block">';
    html += '<div class="lsh-band-label" style="color:' + colour + '">Band ' + (bIdx + 1) + '</div>';

    Object.entries(bucket).forEach(function (entry) {
      var key = entry[0];
      var docIds = entry[1];
      html += '<div class="lsh-bucket-row">';
      html += '<span class="lsh-bucket-hash">' + key + '</span>';
      html += '<div class="lsh-bucket-docs">';
      docIds.forEach(function (id) {
        var cls = docIds.length > 1 ? 'match' : 'solo';
        html += '<span class="lsh-bucket-tag ' + cls + '">D' + id + '</span>';
      });
      html += '</div></div>';
    });

    html += '</div>';
  });

  el.innerHTML = html;
}

/* ── Show candidate results for selected doc ── */
function lshShowResults() {
  var section = document.getElementById('lshResultsSection');
  if (!section || lshSelectedDoc < 0 || lshDocs.length < 2) return;

  section.style.display = 'block';

  var bands    = lshBuildBuckets();
  var allPairs = lshGetCandidates(bands);

  var selDoc = lshDocs.find(function (d) { return d.id === lshSelectedDoc; });
  if (!selDoc) return;

  var candidatePairs = allPairs.filter(function (p) {
    return p[0] === lshSelectedDoc || p[1] === lshSelectedDoc;
  });

  var candidateIds = candidatePairs.map(function (p) {
    return p[0] === lshSelectedDoc ? p[1] : p[0];
  });

  var candidateEl = document.getElementById('lshCandidates');
  if (!candidateEl) return;

  if (!candidateIds.length) {
    candidateEl.innerHTML = '<span class="lsh-empty-text">No candidate pairs found for Doc ' + lshSelectedDoc + '. Try reducing bands or adding more similar documents.</span>';
  } else {
    var rows = candidateIds.map(function (otherId) {
      var otherDoc = lshDocs.find(function (d) { return d.id === otherId; });
      if (!otherDoc) return '';
      var jacc     = lshJaccard(selDoc.shingles, otherDoc.shingles);
      var pct      = Math.round(jacc * 100);
      var jClass   = jacc >= 0.5 ? 'high' : (jacc >= 0.2 ? 'med' : 'low');
      var rowClass  = jacc >= 0.3 ? 'high-sim' : 'low-sim';
      var isFP     = jacc < 0.1;

      return (
        '<div class="lsh-candidate-row ' + rowClass + '">' +
          '<span class="lsh-cand-docs">D' + lshSelectedDoc + ' ↔ D' + otherId + '</span>' +
          '<div class="lsh-cand-bar-wrap"><div class="lsh-cand-bar" style="width:' + pct + '%"></div></div>' +
          '<span class="lsh-cand-jaccard ' + jClass + '">' + pct + '%</span>' +
          (isFP ? '<span class="lsh-cand-fp">false+</span>' : '') +
        '</div>'
      );
    });
    candidateEl.innerHTML = rows.join('');
  }

  lshSetStatus(
    'Doc ' + lshSelectedDoc + ': ' + candidateIds.length + ' candidate pair(s) found via LSH bucket collision. ' +
    'Jaccard verified against true shingled sets. ' + (candidateIds.length ? 'Click brute-force to compare.' : ''),
    candidateIds.length ? 'ok' : 'warn'
  );
}

/* ── Brute-force all-pairs ── */
function lshShowBrute() {
  var card = document.getElementById('lshBruteCard');
  var area = document.getElementById('lshBruteArea');
  var section = document.getElementById('lshResultsSection');

  if (!card || !area || lshDocs.length < 2) {
    lshSetStatus('Add at least two documents before running brute force.', 'warn');
    return;
  }

  section.style.display = 'block';
  card.style.display = 'block';

  var pairs = [];
  for (var i = 0; i < lshDocs.length; i++) {
    for (var j = i + 1; j < lshDocs.length; j++) {
      var jacc = lshJaccard(lshDocs[i].shingles, lshDocs[j].shingles);
      pairs.push({ a: lshDocs[i].id, b: lshDocs[j].id, jacc: jacc });
    }
  }

  pairs.sort(function (x, y) { return y.jacc - x.jacc; });

  var html = pairs.map(function (p) {
    var pct = Math.round(p.jacc * 100);
    var cls = p.jacc >= 0.5 ? 'high' : (p.jacc >= 0.2 ? 'med' : 'low');
    return (
      '<div class="lsh-brute-row">' +
        '<span class="lsh-brute-docs">D' + p.a + ' ↔ D' + p.b + '</span>' +
        '<span class="lsh-brute-jaccard ' + cls + '">' + pct + '%</span>' +
      '</div>'
    );
  }).join('');

  area.innerHTML = html || '<span class="lsh-empty-text">No pairs.</span>';

  lshSetStatus('Brute-force: computed all ' + pairs.length + ' pair(s) — O(n²). LSH avoids most of these.', 'info');
}

/* ── Master render ── */
function lshRenderAll() {
  lshRenderDocList();
  lshRenderSignatures(lshSelectedDoc);
  var bands = lshBuildBuckets();
  lshRenderBands(bands);
}

/* ── Add document ── */
function lshAddDoc(text) {
  if (!text.trim()) {
    lshSetStatus('Please enter a non-empty document.', 'err');
    return;
  }

  if (lshDocs.length >= 12) {
    lshSetStatus('Maximum 12 documents reached. Reset to start over.', 'warn');
    return;
  }

  lshDocCounter++;
  var shingles = lshShingle(text);
  var sig      = lshMinHashSig(shingles, lshK);

  lshDocs.push({ id: lshDocCounter, text: text, shingles: shingles, sig: sig });
  lshRenderAll();
  lshSetStatus('Added Doc ' + lshDocCounter + ' with ' + shingles.size + ' shingles. Click a document to find its nearest neighbors.', 'ok');
}

/* ── Load presets ── */
function lshLoadPreset() {
  lshReset();
  LSH_PRESET_DOCS.forEach(function (t) { lshAddDoc(t); });
  lshSetStatus('Loaded 8 demo documents. Click any document to run LSH nearest-neighbor search on it.', 'info');
}

/* ── Reset ── */
function lshReset() {
  lshDocs        = [];
  lshDocCounter  = 0;
  lshSelectedDoc = -1;

  lshRenderAll();

  var section = document.getElementById('lshResultsSection');
  if (section) section.style.display = 'none';

  var bruteCard = document.getElementById('lshBruteCard');
  if (bruteCard) bruteCard.style.display = 'none';

  lshSetStatus('Reset complete. Add documents or load the demo set.', 'info');
}

function lshSetStatus(msg, cls) {
  var el = document.getElementById('lshStatus');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'lsh-status ' + (cls || '');
}

function lshEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ── Init ── */
function lshInit() {
  lshRenderAll();

  var kSlider   = document.getElementById('lshKSlider');
  var bSlider   = document.getElementById('lshBSlider');
  var kVal      = document.getElementById('lshKVal');
  var bVal      = document.getElementById('lshBVal');
  var docInput  = document.getElementById('lshDocInput');
  var addBtn    = document.getElementById('lshAddBtn');
  var presetBtn = document.getElementById('lshPresetBtn');
  var bruteBtn  = document.getElementById('lshBruteBtn');
  var resetBtn  = document.getElementById('lshResetBtn');

  if (kSlider) {
    kSlider.addEventListener('input', function () {
      lshK = parseInt(kSlider.value, 10);
      lshB = Math.min(lshB, Math.floor(lshK / 2));
      if (bSlider) bSlider.max = Math.floor(lshK / 2);
      if (bSlider && parseInt(bSlider.value, 10) > lshB) bSlider.value = lshB;
      if (kVal) kVal.textContent = lshK;
      var rPB = Math.max(1, Math.floor(lshK / lshB));
      if (bVal) bVal.textContent = lshB + ' bands × ' + rPB + ' rows';
      lshRecomputeAll();
      lshRenderAll();
      if (lshSelectedDoc >= 0) lshShowResults();
    });
  }

  if (bSlider) {
    bSlider.addEventListener('input', function () {
      lshB = parseInt(bSlider.value, 10);
      var rPB = Math.max(1, Math.floor(lshK / lshB));
      if (bVal) bVal.textContent = lshB + ' bands × ' + rPB + ' rows';
      lshRenderAll();
      if (lshSelectedDoc >= 0) lshShowResults();
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', function () {
      var text = docInput ? docInput.value.trim() : '';
      lshAddDoc(text);
      if (docInput) docInput.value = '';
    });
  }

  if (docInput) {
    docInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        lshAddDoc(docInput.value.trim());
        docInput.value = '';
      }
    });
  }

  if (presetBtn) presetBtn.addEventListener('click', lshLoadPreset);
  if (bruteBtn)  bruteBtn.addEventListener('click', lshShowBrute);
  if (resetBtn)  resetBtn.addEventListener('click', lshReset);
}