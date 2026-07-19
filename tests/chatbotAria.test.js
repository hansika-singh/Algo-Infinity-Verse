// tests/chatbotAria.test.js
//
// Verifies initChatbot() applies dialog/live-region ARIA semantics to the
// chatbot widget at init time, and keeps aria-expanded in sync with the
// open/closed state (Issue #2495).

import { jest } from '@jest/globals';

function createFakeElement(overrides = {}) {
  const listeners = {};
  const attrs = {};
  return {
    classList: {
      _hidden: true,
      add: jest.fn(function (cls) { if (cls === 'hidden') this._hidden = true; }),
      remove: jest.fn(function (cls) { if (cls === 'hidden') this._hidden = false; }),
      toggle: jest.fn(function (cls) { if (cls === 'hidden') this._hidden = !this._hidden; }),
      contains: jest.fn(function (cls) { return cls === 'hidden' ? this._hidden : false; }),
    },
    style: {},
    dataset: {},
    disabled: false,
    value: '',
    innerHTML: '',
    id: '',
    setAttribute: jest.fn((name, value) => { attrs[name] = String(value); }),
    getAttribute: jest.fn((name) => (name in attrs ? attrs[name] : null)),
    hasAttribute: jest.fn((name) => name in attrs),
    addEventListener: jest.fn((type, handler) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    }),
    dispatch(type, event = {}) {
      (listeners[type] || []).forEach((handler) => handler(event));
    },
    querySelector: jest.fn(() => null),
    appendChild: jest.fn(),
    insertBefore: jest.fn(),
    scrollTo: jest.fn(),
    remove: jest.fn(),
    ...overrides,
  };
}

describe('chatbot - ARIA semantics', () => {
  let elements;
  let headerTitle;
  let header;
  let originalDocument;
  let originalWindow;

  beforeEach(() => {
    headerTitle = createFakeElement();
    header = createFakeElement({ querySelector: jest.fn((sel) => (sel === 'h4' ? headerTitle : null)) });

    elements = {
      chatbotToggle: createFakeElement(),
      chatbotWindow: createFakeElement({
        querySelector: jest.fn((sel) => (sel === '.chatbot-header' ? header : null)),
      }),
      chatbotClose: createFakeElement(),
      chatbotInput: createFakeElement({ value: '' }),
      chatbotSend: createFakeElement(),
      chatbotMessages: createFakeElement(),
    };
    // Chatbot window starts hidden, matching the real markup's initial class.
    elements.chatbotWindow.classList._hidden = true;

    originalDocument = global.document;
    originalWindow = global.window;

    global.window = { chatbotResponses: {}, userProgress: {} };
    global.document = {
      getElementById: jest.fn((id) => elements[id] || null),
      querySelectorAll: jest.fn(() => []),
      createElement: jest.fn(() => createFakeElement()),
      head: { appendChild: jest.fn() },
    };
  });

  afterEach(() => {
    global.document = originalDocument;
    global.window = originalWindow;
    jest.clearAllMocks();
  });

  it('applies dialog role and aria-modal to the chatbot window', async () => {
    const { initChatbot } = await import('../modules/chatbot.js');
    initChatbot();

    expect(elements.chatbotWindow.setAttribute).toHaveBeenCalledWith('role', 'dialog');
    expect(elements.chatbotWindow.setAttribute).toHaveBeenCalledWith('aria-modal', 'false');
  });

  it('labels the window via aria-labelledby pointing at the header title', async () => {
    const { initChatbot } = await import('../modules/chatbot.js');
    initChatbot();

    expect(headerTitle.id).toBe('chatbotWindowTitle');
    expect(elements.chatbotWindow.setAttribute).toHaveBeenCalledWith('aria-labelledby', 'chatbotWindowTitle');
  });

  it('marks the messages container as a polite live region', async () => {
    const { initChatbot } = await import('../modules/chatbot.js');
    initChatbot();

    expect(elements.chatbotMessages.setAttribute).toHaveBeenCalledWith('role', 'log');
    expect(elements.chatbotMessages.setAttribute).toHaveBeenCalledWith('aria-live', 'polite');
  });

  it('sets aria-expanded=false initially (window starts hidden)', async () => {
    const { initChatbot } = await import('../modules/chatbot.js');
    initChatbot();

    expect(elements.chatbotToggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('toggles aria-expanded to true when the toggle button opens the window', async () => {
    const { initChatbot } = await import('../modules/chatbot.js');
    initChatbot();

    elements.chatbotToggle.dispatch('click');
    expect(elements.chatbotToggle.getAttribute('aria-expanded')).toBe('true');

    elements.chatbotToggle.dispatch('click');
    expect(elements.chatbotToggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('sets aria-expanded=false when the close button is clicked', async () => {
    const { initChatbot } = await import('../modules/chatbot.js');
    initChatbot();

    elements.chatbotToggle.dispatch('click'); // open
    expect(elements.chatbotToggle.getAttribute('aria-expanded')).toBe('true');

    elements.chatbotClose.dispatch('click');
    expect(elements.chatbotToggle.getAttribute('aria-expanded')).toBe('false');
  });
});
