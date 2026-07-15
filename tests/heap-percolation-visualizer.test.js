import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const heapCode = fs.readFileSync(
  path.resolve(
    __dirname,
    '../pages/visualizers/heap-percolation-visualizer/heap-percolation-visualizer.js'
  ),
  'utf-8'
);

class ClassList {
  constructor() {
    this.set = new Set();
  }
  add(c) {
    this.set.add(c);
  }
  remove(c) {
    this.set.delete(c);
  }
  contains(c) {
    return this.set.has(c);
  }
}

class FakeElement {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.className = '';
    this.classList = new ClassList();
    this.id = '';
    this.dataset = {};
    this._textContent = '';
    this._value = '';
    this._listeners = {};
    this.disabled = false;
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
  get clientWidth() {
    return 700;
  }
  get clientHeight() {
    return 520;
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
  querySelectorAll() {
    return [];
  }
}

const ELEMENT_IDS = [
  'typingTextVisualizer',
  'array-input',
  'insert-input',
  'status-message',
  'array-display',
  'nodes-layer',
  'edges-svg',
  'speed-slider',
  'speed-val',
  'btn-min-heap',
  'btn-max-heap',
  'btn-heapify',
  'btn-insert',
  'btn-extract',
  'btn-prev',
  'btn-step',
  'btn-next',
  'btn-play',
  'btn-reset',
];

describe('Heap Percolation Visualizer - initial render (#2354)', () => {
  let originalDocument;
  let originalWindow;
  let originalRAF;
  let elementsById;
  let domContentLoadedHandler;

  beforeEach(() => {
    originalDocument = global.document;
    originalWindow = global.window;
    originalRAF = global.requestAnimationFrame;

    elementsById = {};
    ELEMENT_IDS.forEach((id) => {
      const el = new FakeElement('div');
      el.id = id;
      elementsById[id] = el;
    });
    elementsById['array-input'].value = '10,40,20,5,30';
    elementsById['speed-slider'].value = '800';

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

    global.requestAnimationFrame = jest.fn((cb) => cb());

    eval(heapCode);
    domContentLoadedHandler();
  });

  afterEach(() => {
    global.document = originalDocument;
    global.window = originalWindow;
    global.requestAnimationFrame = originalRAF;
    jest.clearAllMocks();
  });

  test('does not throw on initial load', () => {
    expect(elementsById['btn-prev'].disabled).toBe(true);
    expect(elementsById['btn-next'].disabled).toBe(true);
  });

  test('heapify runs and enables step navigation', () => {
    elementsById['array-input'].value = '10,40,20,5,30';
    elementsById['btn-heapify'].click();

    expect(elementsById['status-message'].textContent).toMatch(/Heapify complete/);
    expect(elementsById['btn-prev'].disabled).toBe(false);
  });

  test('does not throw when stepping and inserting after heapify', () => {
    elementsById['array-input'].value = '10,40,20,5,30';
    elementsById['btn-heapify'].click();

    expect(() => {
      elementsById['btn-prev'].click();
      elementsById['insert-input'].value = '99';
      elementsById['btn-insert'].click();
    }).not.toThrow();
  });
});
