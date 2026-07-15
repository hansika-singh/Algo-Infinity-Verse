import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read auth.js source code
const authCode = fs.readFileSync(path.resolve(__dirname, '../auth.js'), 'utf-8');

describe('Auth Helper Functions', () => {
  let originalDocument;
  let originalWindow;

  beforeEach(() => {
    // Setup minimal DOM for auth.js to parse
    originalDocument = global.document;
    originalWindow = global.window;

    global.document = {
      documentElement: {
        classList: {
          add: jest.fn(),
          remove: jest.fn(),
        },
      },
      addEventListener: jest.fn(),
      querySelector: jest.fn(() => null),
      querySelectorAll: jest.fn(() => []),
      getElementById: jest.fn(() => null),
      body: {
        appendChild: jest.fn(),
      },
    };

    global.window = {
      addEventListener: jest.fn(),
      location: {
        protocol: 'http:',
        pathname: '/login',
        search: '',
        hash: '',
        href: '',
      },
      __supabaseClient: {
        isConfigured: jest.fn(() => true),
        getSessionToken: jest.fn().mockResolvedValue(null),
      },
    };

    global.location = global.window.location;
    global.confirm = jest.fn(() => true);
    global.fetch = jest.fn();

    // Evaluate auth.js in the global scope
    // This will attach the global functions like passwordStrength
    eval(
      authCode +
        `
      if (typeof passwordStrength === 'function') global.passwordStrength = passwordStrength;
      if (typeof wireChangePassword === 'function') global.wireChangePassword = wireChangePassword;
      if (typeof wireDeactivateAccount === 'function') global.wireDeactivateAccount = wireDeactivateAccount;
    `
    );
  });

  afterEach(() => {
    global.document = originalDocument;
    global.window = originalWindow;
    global.location = undefined;
    jest.clearAllMocks();
  });

  describe('passwordStrength', () => {
    test('calculates correct strength score', () => {
      // The function should be available in global scope now
      expect(typeof global.passwordStrength).toBe('function');

      expect(global.passwordStrength('short')).toBe(1); // 1 point for lowercase
      expect(global.passwordStrength('password')).toBe(2); // 8+ chars and lowercase
      expect(global.passwordStrength('Password123')).toBe(4); // 8+ chars, lowercase, uppercase, number
      expect(global.passwordStrength('Password123!')).toBe(5); // all 5 criteria met
    });
  });

  describe('DOM Wiring Functions', () => {
    test('wireChangePassword sets up toggle handlers', () => {
      let clickHandler;
      const mockToggleBtn = {
        addEventListener: jest.fn((event, handler) => {
          if (event === 'click') clickHandler = handler;
        }),
        dataset: { target: 'mockInput' },
        innerHTML: '',
      };

      const mockInput = {
        type: 'password',
      };

      global.document.querySelectorAll = jest.fn((selector) => {
        if (selector === '.password-toggle') return [mockToggleBtn];
        return [];
      });

      global.document.getElementById = jest.fn((id) => {
        if (id === 'mockInput') return mockInput;
        return null;
      });

      if (typeof global.wireChangePassword === 'function') {
        global.wireChangePassword();
        expect(mockToggleBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));

        // Trigger the handler explicitly
        if (clickHandler) clickHandler();

        expect(mockInput.type).toBe('text');
        expect(mockToggleBtn.innerHTML).toContain('fa-eye-slash');
      }
    });

    test('wireDeactivateAccount handles clicks', async () => {
      const mockBtn = {
        addEventListener: jest.fn(),
      };

      global.document.getElementById = jest.fn((id) => {
        if (id === 'deactivateAccountBtn') return mockBtn;
        return null;
      });

      if (typeof global.wireDeactivateAccount === 'function') {
        global.wireDeactivateAccount();
        expect(mockBtn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      }
    });
  });
});
