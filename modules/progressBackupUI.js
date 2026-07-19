// modules/progressBackupUI.js
//
// Browser-only glue for exporting/importing local progress as a JSON
// file. Pure logic lives in progressBackup.js so it stays unit-testable.

import { serializeBackup, parseBackup, mergeProgress } from './progressBackup.js';

const MAX_IMPORT_FILE_SIZE = 2 * 1024 * 1024; // 2MB — generous for this data shape

function getProgress() {
  return (typeof window !== 'undefined' && window.userProgress) || {};
}

function persistProgress(nextProgress) {
  if (typeof window === 'undefined') return;
  window.userProgress = nextProgress;
  if (typeof window.saveUserData === 'function') {
    window.saveUserData();
  } else {
    try {
      localStorage.setItem('algoInfinityVerse', JSON.stringify(nextProgress));
    } catch {
      /* storage unavailable — non-fatal */
    }
  }
}

function notify(message, type = 'info') {
  if (typeof window !== 'undefined' && typeof window.showNotification === 'function') {
    window.showNotification(message, type);
  } else {
    // eslint-disable-next-line no-alert
    if (typeof window !== 'undefined') window.alert(message);
  }
}

/**
 * Trigger a browser download of the current progress as a JSON file.
 */
export function exportProgress() {
  const json = serializeBackup(getProgress());
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const dateStamp = new Date().toISOString().slice(0, 10);

  const link = document.createElement('a');
  link.href = url;
  link.download = `algo-infinity-verse-progress-${dateStamp}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  notify('Progress exported successfully 📦', 'success');
}

/**
 * Import progress from a File object (e.g. from an <input type="file">).
 * @param {File} file
 * @param {'replace'|'merge'} [strategy]
 * @returns {Promise<void>}
 */
export async function importProgressFromFile(file, strategy = 'replace') {
  if (!file) return;
  if (file.size > MAX_IMPORT_FILE_SIZE) {
    notify('That file is too large to be a valid progress backup.', 'error');
    return;
  }

  let text;
  try {
    text = await file.text();
  } catch {
    notify('Could not read the selected file.', 'error');
    return;
  }

  const { valid, errors, payload } = parseBackup(text);
  if (!valid) {
    notify(`Import failed: ${errors[0] || 'invalid file.'}`, 'error');
    return;
  }

  const merged = mergeProgress(getProgress(), payload, strategy);
  persistProgress(merged);
  notify('Progress imported successfully ✅ Reloading...', 'success');

  setTimeout(() => {
    if (typeof window !== 'undefined') window.location.reload();
  }, 900);
}

/**
 * Wire up export/import controls on a settings-style page.
 * Expects the following optional elements in the DOM:
 *  - #exportProgressBtn      (button)
 *  - #importProgressInput    (input[type=file])
 *  - #importProgressStrategy (select with values "replace"/"merge")
 */
export function initProgressBackupControls() {
  if (typeof document === 'undefined') return;

  const exportBtn = document.getElementById('exportProgressBtn');
  const importInput = document.getElementById('importProgressInput');
  const strategySelect = document.getElementById('importProgressStrategy');

  if (exportBtn) {
    exportBtn.addEventListener('click', exportProgress);
  }

  if (importInput) {
    importInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      const strategy = strategySelect?.value === 'merge' ? 'merge' : 'replace';
      await importProgressFromFile(file, strategy);
      importInput.value = '';
    });
  }
}
