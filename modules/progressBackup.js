// modules/progressBackup.js
//
// Export/import helpers for local (localStorage) user progress.
// Pure, DOM-free logic lives here so it can be unit tested; the thin
// browser-only bits (file download / file picker) are added separately.

export const BACKUP_FORMAT_VERSION = 1;

/**
 * Fields that are safe to import into the current progress object.
 * Anything outside this list in an uploaded file is ignored, so an
 * imported file can never inject unexpected/oversized keys.
 */
export const IMPORTABLE_KEYS = [
  'name',
  'avatar',
  'xp',
  'level',
  'streak',
  'joinDate',
  'lastActive',
  'completedProblems',
  'favoriteProblems',
  'problemNotes',
  'bookmarkCollections',
  'quizScores',
  'bestQuizTimes',
  'badges',
  'completedRoadmapSteps',
  'activityData',
  'revisionSchedule',
  'revisionCalendar',
  'codingPersonality',
  'mistakeDna',
  'dailyGoals',
];

/**
 * Build the exportable backup object for the given progress state.
 * @param {Object} progress - the current userProgress object
 * @returns {{formatVersion:number, exportedAt:string, data:Object}}
 */
export function createBackup(progress = {}) {
  const data = {};
  for (const key of IMPORTABLE_KEYS) {
    if (progress[key] !== undefined) data[key] = progress[key];
  }
  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  };
}

/**
 * Serialize a backup object to a pretty-printed JSON string.
 * @param {Object} progress
 * @returns {string}
 */
export function serializeBackup(progress = {}) {
  return JSON.stringify(createBackup(progress), null, 2);
}

/**
 * Validate a parsed backup payload's shape.
 * Returns { valid: boolean, errors: string[] }.
 * @param {*} payload
 */
export function validateBackup(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['File does not contain a valid backup object.'] };
  }
  if (typeof payload.formatVersion !== 'number') {
    errors.push('Missing or invalid "formatVersion".');
  } else if (payload.formatVersion > BACKUP_FORMAT_VERSION) {
    errors.push(
      `Backup format version ${payload.formatVersion} is newer than supported version ${BACKUP_FORMAT_VERSION}.`
    );
  }
  if (!payload.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) {
    errors.push('Missing or invalid "data" object.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Parse a raw JSON string into a backup payload.
 * Returns { valid: boolean, errors: string[], payload?: Object }.
 * @param {string} jsonText
 */
export function parseBackup(jsonText) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { valid: false, errors: ['File is not valid JSON.'] };
  }
  const { valid, errors } = validateBackup(parsed);
  return valid ? { valid, errors, payload: parsed } : { valid, errors };
}

/**
 * Merge an imported backup's data into the current progress.
 * Only whitelisted keys are copied over (see IMPORTABLE_KEYS); unknown
 * keys in the backup are silently ignored.
 *
 * strategy:
 *  - 'replace': imported values overwrite current values for every key present in the backup
 *  - 'merge'  : imported values are only applied where the current value is empty/undefined
 *               (arrays: current empty array; objects: current empty object; else undefined/null)
 *
 * Pure function — returns a new object, does not mutate inputs.
 *
 * @param {Object} current
 * @param {Object} backupPayload - result of parseBackup(...).payload
 * @param {'replace'|'merge'} [strategy]
 * @returns {Object} merged progress
 */
export function mergeProgress(current = {}, backupPayload = {}, strategy = 'replace') {
  const result = { ...current };
  const importedData = backupPayload?.data || {};

  for (const key of IMPORTABLE_KEYS) {
    if (!(key in importedData)) continue;
    const importedValue = importedData[key];

    if (strategy === 'replace') {
      result[key] = importedValue;
      continue;
    }

    // 'merge' strategy: only fill in when current is empty/missing
    const currentValue = current[key];
    const isEmpty =
      currentValue === undefined ||
      currentValue === null ||
      (Array.isArray(currentValue) && currentValue.length === 0) ||
      (typeof currentValue === 'object' &&
        !Array.isArray(currentValue) &&
        Object.keys(currentValue).length === 0);

    if (isEmpty) result[key] = importedValue;
  }

  return result;
}
