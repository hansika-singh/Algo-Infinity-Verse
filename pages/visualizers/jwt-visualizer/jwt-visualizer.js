// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: JWT Visualizer only

document.addEventListener('DOMContentLoaded', function () {
  jwtInit();
});

/* ─── Utilities ─── */
function base64UrlEncode(str) {
  let b64 = btoa(unescape(encodeURIComponent(str)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    return null;
  }
}

// Convert string to Uint8Array
function str2ab(str) {
  let buf = new ArrayBuffer(str.length);
  let bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
}

// Convert Uint8Array to Base64Url
function ab2base64url(buf) {
  let binary = '';
  let bytes = new Uint8Array(buf);
  let len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let b64 = btoa(binary);
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/* ─── Crypto HMAC SHA-256 ─── */
async function generateSignature(headerB64, payloadB64, secretStr, isBase64Secret) {
  let dataStr = headerB64 + '.' + payloadB64;
  let data = new TextEncoder().encode(dataStr);

  let secretBytes;
  if (isBase64Secret) {
    try {
      let decoded = atob(secretStr);
      secretBytes = str2ab(decoded);
    } catch (e) {
      secretBytes = new TextEncoder().encode(secretStr);
    }
  } else {
    secretBytes = new TextEncoder().encode(secretStr);
  }

  try {
    let cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: { name: 'SHA-256' } },
      false,
      ['sign']
    );
    let signature = await window.crypto.subtle.sign('HMAC', cryptoKey, data);
    return ab2base64url(signature);
  } catch (e) {
    console.error('Crypto error:', e);
    return 'signature_error';
  }
}

// Utility to prevent XSS when writing user-editable content into innerHTML
// (delegating to centralized DOMSanitizer if available)
function escapeHtml(unsafe) {
  if (typeof window !== 'undefined' && window.DOMSanitizer) {
    return window.DOMSanitizer.escapeHtml(unsafe);
  }
  return String(unsafe == null ? '' : unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─── State ─── */
let jwtState = {
  headerObj: { alg: 'HS256', typ: 'JWT' },
  payloadObj: { sub: '1234567890', name: 'John Doe', iat: 1516239022 },
  secret: 'your-256-bit-secret',
  isSecretB64: false,

  // Encoded parts
  headerB64: '',
  payloadB64: '',
  signatureB64: '',

  // Flags
  isValid: true,
  isUpdatingFromEncoded: false,
};

/* ─── Update UI ─── */
async function updateFromDecoded() {
  if (jwtState.isUpdatingFromEncoded) return;

  let hInput = document.getElementById('jwtInputHeader').value;
  let pInput = document.getElementById('jwtInputPayload').value;

  let hErr = document.getElementById('jwtErrHeader');
  let pErr = document.getElementById('jwtErrPayload');

  hErr.textContent = '';
  pErr.textContent = '';

  try {
    jwtState.headerObj = JSON.parse(hInput);
  } catch (e) {
    hErr.textContent = 'Invalid JSON';
    return;
  }

  try {
    jwtState.payloadObj = JSON.parse(pInput);
  } catch (e) {
    pErr.textContent = 'Invalid JSON';
    return;
  }

  let sInput = document.getElementById('jwtInputSecret').value;
  jwtState.secret = sInput;
  jwtState.isSecretB64 = document.getElementById('jwtSecretBase64').checked;

  // Encode
  jwtState.headerB64 = base64UrlEncode(JSON.stringify(jwtState.headerObj));
  jwtState.payloadB64 = base64UrlEncode(JSON.stringify(jwtState.payloadObj));

  // Sign
  jwtState.signatureB64 = await generateSignature(
    jwtState.headerB64,
    jwtState.payloadB64,
    jwtState.secret,
    jwtState.isSecretB64
  );

  jwtState.isValid = true;
  renderEncoded();
  renderStatus();
}

async function updateFromEncoded() {
  jwtState.isUpdatingFromEncoded = true;

  let encodedEl = document.getElementById('jwtEncodedDisplay');
  // Strip HTML and whitespace
  let token = encodedEl.innerText.replace(/\s+/g, '');

  let parts = token.split('.');

  let hInput = document.getElementById('jwtInputHeader');
  let pInput = document.getElementById('jwtInputPayload');

  if (parts.length > 0 && parts[0]) {
    jwtState.headerB64 = parts[0];
    let decodedH = base64UrlDecode(parts[0]);
    if (decodedH) {
      try {
        jwtState.headerObj = JSON.parse(decodedH);
        hInput.value = JSON.stringify(jwtState.headerObj, null, 2);
      } catch (e) {
        hInput.value = decodedH;
      }
    } else {
      hInput.value = 'Invalid Base64Url';
    }
  }

  if (parts.length > 1 && parts[1]) {
    jwtState.payloadB64 = parts[1];
    let decodedP = base64UrlDecode(parts[1]);
    if (decodedP) {
      try {
        jwtState.payloadObj = JSON.parse(decodedP);
        pInput.value = JSON.stringify(jwtState.payloadObj, null, 2);
      } catch (e) {
        pInput.value = decodedP;
      }
    } else {
      pInput.value = 'Invalid Base64Url';
    }
  }

  if (parts.length > 2) {
    jwtState.signatureB64 = parts[2];
  } else {
    jwtState.signatureB64 = '';
  }

  // Verify Signature
  let expectedSig = await generateSignature(
    jwtState.headerB64,
    jwtState.payloadB64,
    jwtState.secret,
    jwtState.isSecretB64
  );

  if (parts.length === 3 && parts[2] === expectedSig) {
    jwtState.isValid = true;
  } else {
    jwtState.isValid = false;
  }

  renderEncoded(); // To re-apply color spans
  renderStatus();

  // Move cursor to end to prevent messing up typing
  let range = document.createRange();
  let sel = window.getSelection();
  range.selectNodeContents(encodedEl);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);

  jwtState.isUpdatingFromEncoded = false;
}

function renderEncoded() {
  let el = document.getElementById('jwtEncodedDisplay');
  if (!el) return;

  // If user is currently typing in the contenteditable, we don't want to completely destroy their formatting mid-type
  // unless we are updating FROM decoded.
  // To handle this nicely, we'll just set innerHTML

  let html = `<span class="part-header">${escapeHtml(jwtState.headerB64)}</span><span class="part-dot">.</span><span class="part-payload">${escapeHtml(jwtState.payloadB64)}</span><span class="part-dot">.</span><span class="part-signature">${escapeHtml(jwtState.signatureB64)}</span>`;
  el.innerHTML = html;
}

function renderStatus() {
  let el = document.getElementById('jwtStatus');
  if (!el) return;

  if (jwtState.isValid) {
    el.textContent = 'Signature Verified';
    el.className = 'jwt-status valid';
  } else {
    el.textContent = 'Invalid Signature';
    el.className = 'jwt-status invalid';
  }
}

/* ─── Init ─── */
function jwtInit() {
  let hInput = document.getElementById('jwtInputHeader');
  let pInput = document.getElementById('jwtInputPayload');
  let sInput = document.getElementById('jwtInputSecret');
  let cbBase64 = document.getElementById('jwtSecretBase64');
  let encodedDisplay = document.getElementById('jwtEncodedDisplay');

  if (hInput) {
    hInput.value = JSON.stringify(jwtState.headerObj, null, 2);
    hInput.addEventListener('input', updateFromDecoded);
  }
  if (pInput) {
    pInput.value = JSON.stringify(jwtState.payloadObj, null, 2);
    pInput.addEventListener('input', updateFromDecoded);
  }
  if (sInput) {
    sInput.value = jwtState.secret;
    sInput.addEventListener('input', updateFromDecoded);
  }
  if (cbBase64) {
    cbBase64.checked = jwtState.isSecretB64;
    cbBase64.addEventListener('change', updateFromDecoded);
  }

  if (encodedDisplay) {
    encodedDisplay.addEventListener('input', updateFromEncoded);
    // Prevent formatting (paste as plain text)
    encodedDisplay.addEventListener('paste', function (e) {
      e.preventDefault();
      let text = (e.originalEvent || e).clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    });
  }

  // Initial render
  updateFromDecoded();
}
