// tests/progressBackup.test.js

import {
  BACKUP_FORMAT_VERSION,
  createBackup,
  serializeBackup,
  validateBackup,
  parseBackup,
  mergeProgress,
} from '../modules/progressBackup.js';

describe('progressBackup - createBackup / serializeBackup', () => {
  it('includes only whitelisted keys and stamps a format version', () => {
    const progress = {
      name: 'Ada',
      xp: 500,
      favoriteProblems: [1, 2, 3],
      secretInternalField: 'should not be exported',
    };
    const backup = createBackup(progress);
    expect(backup.formatVersion).toBe(BACKUP_FORMAT_VERSION);
    expect(typeof backup.exportedAt).toBe('string');
    expect(backup.data.name).toBe('Ada');
    expect(backup.data.xp).toBe(500);
    expect(backup.data.favoriteProblems).toEqual([1, 2, 3]);
    expect(backup.data.secretInternalField).toBeUndefined();
  });

  it('serializes to valid, re-parseable JSON', () => {
    const json = serializeBackup({ xp: 10, name: 'Grace' });
    const parsed = JSON.parse(json);
    expect(parsed.data.xp).toBe(10);
    expect(parsed.data.name).toBe('Grace');
  });

  it('omits keys that are undefined on the source progress', () => {
    const backup = createBackup({ xp: 10 });
    expect('name' in backup.data).toBe(false);
    expect(backup.data.xp).toBe(10);
  });
});

describe('progressBackup - validateBackup / parseBackup', () => {
  it('accepts a well-formed backup object', () => {
    const payload = { formatVersion: 1, exportedAt: 'now', data: { xp: 5 } };
    expect(validateBackup(payload)).toEqual({ valid: true, errors: [] });
  });

  it('rejects non-object payloads', () => {
    expect(validateBackup(null).valid).toBe(false);
    expect(validateBackup('nope').valid).toBe(false);
    expect(validateBackup([1, 2, 3]).valid).toBe(false);
  });

  it('rejects a missing or non-object data field', () => {
    expect(validateBackup({ formatVersion: 1 }).valid).toBe(false);
    expect(validateBackup({ formatVersion: 1, data: 'nope' }).valid).toBe(false);
  });

  it('rejects a future/unsupported formatVersion', () => {
    const result = validateBackup({ formatVersion: 999, data: {} });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/newer than supported/);
  });

  it('parseBackup rejects invalid JSON text', () => {
    const result = parseBackup('{not valid json');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/not valid JSON/);
  });

  it('parseBackup returns the parsed payload on success', () => {
    const json = JSON.stringify({ formatVersion: 1, data: { xp: 42 } });
    const result = parseBackup(json);
    expect(result.valid).toBe(true);
    expect(result.payload.data.xp).toBe(42);
  });
});

describe('progressBackup - mergeProgress', () => {
  const backupPayload = {
    formatVersion: 1,
    data: {
      xp: 999,
      favoriteProblems: [10, 20],
      name: 'Imported Name',
      maliciousKey: 'should be ignored',
    },
  };

  it('replace strategy overwrites existing values for keys present in the backup', () => {
    const current = { xp: 5, favoriteProblems: [1], name: 'Original' };
    const merged = mergeProgress(current, backupPayload, 'replace');
    expect(merged.xp).toBe(999);
    expect(merged.favoriteProblems).toEqual([10, 20]);
    expect(merged.name).toBe('Imported Name');
  });

  it('never imports keys outside the whitelist', () => {
    const merged = mergeProgress({}, backupPayload, 'replace');
    expect(merged.maliciousKey).toBeUndefined();
  });

  it('merge strategy only fills in empty/missing fields', () => {
    const current = { xp: 5, favoriteProblems: [], name: 'Keep Me' };
    const merged = mergeProgress(current, backupPayload, 'merge');
    expect(merged.xp).toBe(5); // xp already set, not overwritten
    expect(merged.favoriteProblems).toEqual([10, 20]); // was empty, filled in
    expect(merged.name).toBe('Keep Me'); // already set, not overwritten
  });

  it('does not mutate the input progress object', () => {
    const current = { xp: 5 };
    const snapshot = { ...current };
    mergeProgress(current, backupPayload, 'replace');
    expect(current).toEqual(snapshot);
  });

  it('handles an empty backup payload gracefully', () => {
    const current = { xp: 5, name: 'Same' };
    const merged = mergeProgress(current, {}, 'replace');
    expect(merged).toEqual(current);
  });
});
