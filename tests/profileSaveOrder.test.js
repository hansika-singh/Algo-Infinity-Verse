// tests/profileSaveOrder.test.js
//
// Verifies saveProfileChanges() persists the new name/languages correctly
// and that a subsequent read of localStorage (simulating a page reload)
// reflects the change rather than the stale pre-edit value (Issue #2538).

import { jest } from '@jest/globals';

function createFakeLocalStorage() {
  const store = new Map();
  return {
    getItem: jest.fn((key) => (store.has(key) ? store.get(key) : null)),
    setItem: jest.fn((key, value) => store.set(key, String(value))),
    removeItem: jest.fn((key) => store.delete(key)),
    clear: jest.fn(() => store.clear()),
  };
}

function createFakeElement(overrides = {}) {
  return {
    value: '',
    textContent: '',
    innerHTML: '',
    classList: { add: jest.fn(), remove: jest.fn() },
    ...overrides,
  };
}

describe('profile-edit - saveProfileChanges persistence order', () => {
  let originalDocument;
  let originalWindow;
  let originalLocalStorage;
  let fakeLocalStorage;
  let nameInput;

  beforeEach(() => {
    originalDocument = global.document;
    originalWindow = global.window;
    originalLocalStorage = global.localStorage;

    fakeLocalStorage = createFakeLocalStorage();
    global.localStorage = fakeLocalStorage;

    nameInput = createFakeElement({ value: 'New Display Name' });

    // Seed "existing" saved progress with the OLD name, mirroring a real
    // session that started before this edit.
    fakeLocalStorage.setItem('algoInfinityVerse', JSON.stringify({ name: 'Old Name', languages: ['Python'] }));

    // window.userProgress starts out with the OLD values too (as it would
    // in the real app, loaded at page-load time before the user edits).
    global.window = {
      userProgress: { name: 'Old Name', languages: ['Python'] },
      saveUserData: jest.fn(function () {
        // Mirrors script.js's real saveUserData(): persists whatever is
        // CURRENTLY in window.userProgress at call time.
        global.localStorage.setItem('algoInfinityVerse', JSON.stringify(global.window.userProgress));
      }),
    };

    global.document = {
      getElementById: jest.fn((id) => (id === 'profileNameInput' ? nameInput : null)),
      querySelectorAll: jest.fn(() => []),
      querySelector: jest.fn(() => null),
    };
  });

  afterEach(() => {
    global.document = originalDocument;
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
    jest.clearAllMocks();
  });

  it('persists the new name to localStorage, surviving a simulated reload', async () => {
    const { saveProfileChanges, loadProgress } = await import('../modules/profile-edit.js');

    saveProfileChanges();

    // Simulate a page reload: re-read directly from localStorage.
    const reloaded = loadProgress();
    expect(reloaded.name).toBe('New Display Name');
  });

  it('calls saveUserData() after window.userProgress has already been updated', async () => {
    const { saveProfileChanges } = await import('../modules/profile-edit.js');

    let userProgressNameAtSaveTime = null;
    global.window.saveUserData = jest.fn(function () {
      userProgressNameAtSaveTime = global.window.userProgress.name;
      global.localStorage.setItem('algoInfinityVerse', JSON.stringify(global.window.userProgress));
    });

    saveProfileChanges();

    expect(userProgressNameAtSaveTime).toBe('New Display Name');
  });

  it('updates window.userProgress.name in memory', async () => {
    const { saveProfileChanges } = await import('../modules/profile-edit.js');

    saveProfileChanges();

    expect(global.window.userProgress.name).toBe('New Display Name');
  });
});
