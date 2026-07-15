import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const trieCode = fs.readFileSync(
  path.resolve(__dirname, '../pages/visualizers/trie-visualizer/trie-visualizer.js'),
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
  set innerHTML(_v) {
    this.children = [];
  }
  get innerHTML() {
    return '';
  }
  get scrollWidth() {
    return 900;
  }
  get scrollHeight() {
    return 400;
  }
  get clientWidth() {
    return 900;
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
}

describe('Trie Visualizer - initial render (#2353)', () => {
  let originalDocument;
  let originalWindow;
  let elementsById;
  let domContentLoadedHandler;

  beforeEach(() => {
    originalDocument = global.document;
    originalWindow = global.window;

    elementsById = {};
    [
      'trieTreeArea',
      'trieLinesSvg',
      'wordInput',
      'statusBox',
      'explanationBox',
      'stepCounter',
      'playPauseBtn',
      'insertBtn',
      'searchBtn',
      'resetBtn',
      'previousBtn',
      'nextBtn',
      'typingTextVisualizer',
    ].forEach((id) => {
      const el = new FakeElement('div');
      el.id = id;
      elementsById[id] = el;
    });

    domContentLoadedHandler = null;

    global.document = {
      addEventListener: jest.fn((evt, cb) => {
        if (evt === 'DOMContentLoaded') domContentLoadedHandler = cb;
      }),
      getElementById: jest.fn((id) => elementsById[id] || null),
      createElement: jest.fn((tag) => new FakeElement(tag)),
      createElementNS: jest.fn((_ns, tag) => new FakeElement(tag)),
    };

    global.window = {
      matchMedia: jest.fn(() => ({ matches: true })),
      addEventListener: jest.fn(),
    };

    eval(trieCode);
    domContentLoadedHandler();
  });

  afterEach(() => {
    global.document = originalDocument;
    global.window = originalWindow;
    jest.clearAllMocks();
  });

  test('does not throw on initial load and renders the root node', () => {
    const area = elementsById['trieTreeArea'];
    expect(area.children.length).toBe(1);
    expect(area.children[0].id).toBe('root');
  });

  test('highlights the active path after inserting a word', () => {
    elementsById['wordInput'].value = 'cat';
    elementsById['insertBtn'].click();
    elementsById['nextBtn'].click();

    const area = elementsById['trieTreeArea'];
    expect(area.children[0].className).toContain('created');
  });

  test('does not throw when stepping through insert playback', () => {
    elementsById['wordInput'].value = 'cat';
    elementsById['insertBtn'].click();

    expect(() => {
      elementsById['nextBtn'].click();
      elementsById['nextBtn'].click();
    }).not.toThrow();
  });
});
