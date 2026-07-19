import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const aesCode = fs.readFileSync(
  path.resolve(__dirname, '../pages/visualizers/aes-visualizer/aes-visualizer.js'),
  'utf-8'
);

class FakeElement {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.className = '';
    this.id = '';
    this._textContent = '';
    this._value = '';
    this._listeners = {};
    this.classList = {
      add: (cls) => {
        if (!this.className.includes(cls)) {
          this.className = (this.className + ' ' + cls).trim();
        }
      },
      remove: (cls) => {
        this.className = this.className.replace(cls, '').trim();
      },
      toggle: (cls, force) => {
        if (force === undefined ? this.className.includes(cls) : !force) {
          this.classList.remove(cls);
        } else {
          this.classList.add(cls);
        }
      },
      contains: (cls) => this.className.includes(cls),
    };
  }
  set textContent(v) {
    this._textContent = v;
  }
  get textContent() {
    return this._textContent;
  }
  set value(v) {
    this._value = v;
  }
  get value() {
    return this._value;
  }
  set innerHTML(v) {
    this.children = [];
  }
  get innerHTML() {
    return '';
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  addEventListener(evt, cb) {
    this._listeners[evt] = cb;
  }
  click() {
    if (this._listeners.click) this._listeners.click();
  }
  querySelectorAll(_selector) {
    return [];
  }
  scrollIntoView() {}
}

describe('AES Visualizer - initial render', () => {
  let originalDocument;
  let originalWindow;
  let elementsById;
  let domContentLoadedHandler;

  beforeEach(() => {
    originalDocument = global.document;
    originalWindow = global.window;

    elementsById = {};
    [
      'plaintextInput',
      'keyInput',
      'btnRandomize',
      'btnReset',
      'btnPrev',
      'btnStep',
      'btnPlayPause',
      'roundKeysContainer',
      'stateMatrixGrid',
      'operationDetailsArea',
      'explanationText',
      'currentRoundNum',
      'opTitle',
      'state-status',
      'prog-init',
      'prog-sub',
      'prog-shift',
      'prog-mix',
      'prog-xor',
    ].forEach((id) => {
      const el = new FakeElement('div');
      el.id = id;
      elementsById[id] = el;
    });

    elementsById['plaintextInput'].value = 'Hello AES Visual';
    elementsById['keyInput'].value = 'MySecretAESKey12';

    domContentLoadedHandler = null;

    global.document = {
      addEventListener: jest.fn((evt, cb) => {
        if (evt === 'DOMContentLoaded') domContentLoadedHandler = cb;
      }),
      getElementById: jest.fn((id) => elementsById[id] || null),
      createElement: jest.fn((tag) => new FakeElement(tag)),
      querySelector: jest.fn((_sel) => null),
    };

    global.window = {
      matchMedia: jest.fn(() => ({ matches: true })),
      addEventListener: jest.fn(),
    };

    eval(aesCode);
    domContentLoadedHandler();
  });

  afterEach(() => {
    global.document = originalDocument;
    global.window = originalWindow;
    jest.clearAllMocks();
  });

  test('does not throw on initial load', () => {
    expect(elementsById['currentRoundNum'].textContent).toBe(0);
    expect(elementsById['opTitle'].textContent).toBe('Plaintext State');
  });

  test('correctly parses hex and string inputs', () => {
    // We instantiate a test visualizer to test its helpers directly
    const visualizer = new global.window.AESVisualizer();

    // ASCII string
    const stringBytes = visualizer.parseInput('Hello AES Visual');
    expect(stringBytes[0]).toBe('H'.charCodeAt(0));
    expect(stringBytes.length).toBe(16);

    // Hex string (32 chars)
    const hexBytes = visualizer.parseInput('00112233445566778899AABBCCDDEEFF');
    expect(hexBytes[0]).toBe(0x00);
    expect(hexBytes[15]).toBe(0xff);
    expect(hexBytes.length).toBe(16);
  });

  test('performs correct key expansion', () => {
    const visualizer = new global.window.AESVisualizer();
    const key = visualizer.parseInput('MySecretAESKey12');
    const expanded = visualizer.expandKeys(key);
    expect(expanded.length).toBe(11);
    expect(expanded[0]).toEqual(key);
  });
});
