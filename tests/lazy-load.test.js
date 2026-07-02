import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

const scriptPath = path.resolve(process.cwd(), 'scripts/lazy-load.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

describe('Lazy Loading script', () => {
  let docEvents = {};
  let querySelectorAllMock;
  let mockObserverInstance;
  let observerCallback;

  beforeEach(() => {
    docEvents = {};
    querySelectorAllMock = jest.fn();

    global.document = {
      addEventListener: (event, cb) => {
        docEvents[event] = cb;
      },
      querySelectorAll: querySelectorAllMock,
    };

    global.window = {};

    global.createMockElement = (tagName, dataset = {}, className = '') => {
      const classList = {
        classes: new Set(className.split(' ').filter(Boolean)),
        add(cls) { this.classes.add(cls); },
        remove(cls) { this.classes.delete(cls); },
        contains(cls) { return this.classes.has(cls); }
      };
      return {
        tagName,
        dataset,
        classList,
        style: { backgroundImage: '' },
        get className() { return Array.from(classList.classes).join(' '); }
      };
    };
  });

  afterEach(() => {
    delete global.document;
    delete global.window;
    delete global.IntersectionObserver;
    delete global.createMockElement;
    jest.clearAllMocks();
  });

  test('should use IntersectionObserver if supported in window', () => {
    mockObserverInstance = {
      observe: jest.fn(),
      unobserve: jest.fn()
    };
    const mockObserver = jest.fn().mockImplementation((callback) => {
      observerCallback = callback;
      return mockObserverInstance;
    });
    global.window.IntersectionObserver = mockObserver;
    global.IntersectionObserver = mockObserver;

    const imgEl = global.createMockElement('img', { src: 'test.png', srcset: 'test@2x.png 2x' }, 'lazy-image');
    const bgEl = global.createMockElement('div', { bg: 'bg.jpg' }, 'lazy-bg');

    querySelectorAllMock.mockReturnValue([imgEl, bgEl]);

    eval(scriptContent);

    // Trigger DOMContentLoaded
    expect(docEvents['DOMContentLoaded']).toBeDefined();
    docEvents['DOMContentLoaded']();

    expect(querySelectorAllMock).toHaveBeenCalledWith('img.lazy-image, .lazy-bg');
    expect(global.window.IntersectionObserver).toHaveBeenCalled();
    expect(mockObserverInstance.observe).toHaveBeenCalledWith(imgEl);
    expect(mockObserverInstance.observe).toHaveBeenCalledWith(bgEl);

    // Simulate intersection event
    observerCallback([
      { isIntersecting: true, target: imgEl },
      { isIntersecting: true, target: bgEl }
    ], mockObserverInstance);

    expect(imgEl.src).toBe('test.png');
    expect(imgEl.srcset).toBe('test@2x.png 2x');

    // Image onload handles class loading
    expect(imgEl.classList.contains('lazy-loaded')).toBe(false);
    imgEl.onload();
    expect(imgEl.classList.contains('lazy-loaded')).toBe(true);
    expect(imgEl.classList.contains('lazy-image')).toBe(false);

    // Background div updates immediately
    expect(bgEl.style.backgroundImage).toBe('url(bg.jpg)');
    expect(bgEl.classList.contains('lazy-loaded')).toBe(true);
    expect(bgEl.classList.contains('lazy-bg')).toBe(false);

    expect(mockObserverInstance.unobserve).toHaveBeenCalledWith(imgEl);
    expect(mockObserverInstance.unobserve).toHaveBeenCalledWith(bgEl);
  });

  test('should fallback to direct loading if IntersectionObserver is not supported', () => {
    const imgEl = global.createMockElement('img', { src: 'test.png', srcset: 'test@2x.png 2x' }, 'lazy-image');
    const bgEl = global.createMockElement('div', { bg: 'bg.jpg' }, 'lazy-bg');

    querySelectorAllMock.mockReturnValue([imgEl, bgEl]);

    eval(scriptContent);

    // Trigger DOMContentLoaded
    docEvents['DOMContentLoaded']();

    // Fallback loads resources immediately
    expect(imgEl.src).toBe('test.png');
    expect(imgEl.srcset).toBe('test@2x.png 2x');
    expect(imgEl.classList.contains('lazy-loaded')).toBe(true);
    expect(imgEl.classList.contains('lazy-image')).toBe(false);

    expect(bgEl.style.backgroundImage).toBe('url(bg.jpg)');
    expect(bgEl.classList.contains('lazy-loaded')).toBe(true);
    expect(bgEl.classList.contains('lazy-bg')).toBe(false);
  });
});
