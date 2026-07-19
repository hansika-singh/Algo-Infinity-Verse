import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest } from '@jest/globals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const cnnCode = fs.readFileSync(
  path.resolve(__dirname, '../pages/visualizers/cnn-visualizer/cnn-visualizer.js'),
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
    this.dataset = {};
    this.classList = {
      add: (...classes) => {
        const current = this.className.split(' ').filter(Boolean);
        classes.forEach((c) => {
          if (!current.includes(c)) current.push(c);
        });
        this.className = current.join(' ');
      },
      remove: (...classes) => {
        let current = this.className.split(' ').filter(Boolean);
        current = current.filter((c) => !classes.includes(c));
        this.className = current.join(' ');
      },
      contains: (c) => this.className.split(' ').includes(c),
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
  dispatchEvent(event) {
    if (this._listeners[event.type]) {
      this._listeners[event.type](event);
    }
  }
  querySelectorAll(_selector) {
    return this.children;
  }
  querySelector(selector) {
    const match = selector.match(/\[data-r="(\d+)"\]\[data-c="(\d+)"\]/);
    if (match) {
      const r = match[1];
      const c = match[2];
      return this.children.find((child) => child.dataset.r == r && child.dataset.c == c) || null;
    }
    return this.children.find((c) => c.tag === 'div') || null;
  }
}

describe('CNN Visualizer - Logic and UI State', () => {
  let originalDocument;
  let originalWindow;
  let elementsById;
  let domContentLoadedHandler;

  let originalDocument;
  let originalWindow;
  let originalImage;
  let originalEvent;

  beforeEach(() => {
    originalDocument = global.document;
    originalWindow = global.window;
    originalImage = global.Image;
    originalEvent = global.Event;

    elementsById = {};
    [
      'imageSelect',
      'fileInput',
      'kernelSelect',
      'paddingSelect',
      'strideSelect',
      'activationSelect',
      'poolingSelect',
      'speedSlider',
      'speedVal',
      'playBtn',
      'stepBtn',
      'resetBtn',
      'mathFormula',
      'inputGrid',
      'kernelGrid',
      'featureMapGrid',
      'pooledGrid',
      'bar-cat',
      'val-cat',
      'bar-dog',
      'val-dog',
      'bar-car',
      'val-car',
      'bar-plane',
      'val-plane',
    ].forEach((id) => {
      const el = new FakeElement('div');
      el.id = id;
      elementsById[id] = el;
    });

    // Default configuration values
    elementsById['imageSelect'].value = 'smiley';
    elementsById['kernelSelect'].value = 'sobelV';
    elementsById['paddingSelect'].value = '0';
    elementsById['strideSelect'].value = '1';
    elementsById['activationSelect'].value = 'relu';
    elementsById['poolingSelect'].value = 'max';
    elementsById['speedSlider'].value = '300';

    domContentLoadedHandler = null;

    global.document = {
      addEventListener: jest.fn((evt, cb) => {
        if (evt === 'DOMContentLoaded') domContentLoadedHandler = cb;
      }),
      getElementById: jest.fn((id) => elementsById[id] || null),
      createElement: jest.fn((tag) => {
        if (tag === 'canvas') {
          return {
            getContext: () => ({
              drawImage: jest.fn(),
              getImageData: () => ({
                data: new Uint8ClampedArray(14 * 14 * 4),
              }),
            }),
            width: 14,
            height: 14,
          };
        }
        return new FakeElement(tag);
      }),
    };

    global.window = {
      addEventListener: jest.fn(),
    };

    global.Image = class {
      constructor() {
        setTimeout(() => {
          if (this.onload) this.onload();
        }, 0);
      }
    };

    global.Event = class {
      constructor(type) {
        this.type = type;
      }
    };

    eval(cnnCode);
    domContentLoadedHandler();
  });

  afterEach(() => {
    global.document = originalDocument;
    global.window = originalWindow;
    global.Image = originalImage;
    global.Event = originalEvent;
    jest.clearAllMocks();
  });

  test('does not throw on initial load and initializes input matrix and preset', () => {
    const inputArea = elementsById['inputGrid'];
    expect(inputArea.children.length).toBe(196); // 14x14
  });

  test('steps through convolution correctly and updates current stage', () => {
    elementsById['stepBtn']._listeners['click']();
    // After one step, we expect mathFormula to be updated
    expect(elementsById['mathFormula'].textContent).toContain('Conv(R:0, C:0)');
  });

  test('resets animation state on kernel selection change', () => {
    elementsById['kernelSelect'].value = 'ridge';
    elementsById['kernelSelect'].dispatchEvent(new global.Event('change'));
    expect(elementsById['mathFormula'].textContent).toContain('Select a cell');
  });
});
