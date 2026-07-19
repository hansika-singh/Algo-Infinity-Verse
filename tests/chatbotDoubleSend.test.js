// tests/chatbotDoubleSend.test.js
//
// Verifies the chatbot's sendMessage() guards against rapid double-send
// (Issue #2497): while a bot response is pending, further activations of
// Send / Enter / quick-question buttons should be ignored, and the
// controls should be disabled/re-enabled around the pending response.
//
// modules/chatbot.js is DOM-driven with no top-level side effects, so we
// build a minimal fake DOM sufficient for initChatbot()'s exact needs
// rather than pulling in a full jsdom dependency.

import { jest } from '@jest/globals';

function createFakeElement(overrides = {}) {
  const listeners = {};
  return {
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      toggle: jest.fn(),
      contains: jest.fn(() => false),
    },
    style: {},
    dataset: {},
    disabled: false,
    value: '',
    innerHTML: '',
    addEventListener: jest.fn((type, handler) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    }),
    dispatch(type, event = {}) {
      (listeners[type] || []).forEach((handler) => handler(event));
    },
    querySelector: jest.fn(() => null),
    appendChild: jest.fn(),
    getAttribute: jest.fn(() => null),
    hasAttribute: jest.fn(() => false),
    setAttribute: jest.fn(),
    scrollTo: jest.fn(),
    remove: jest.fn(),
    ...overrides,
  };
}

describe('chatbot - sendMessage double-send guard', () => {
  let elements;
  let quickQButtons;
  let originalDocument;
  let originalWindow;

  beforeEach(() => {
    jest.useFakeTimers();

    elements = {
      chatbotToggle: createFakeElement(),
      chatbotWindow: createFakeElement({ querySelector: jest.fn(() => null) }),
      chatbotClose: createFakeElement(),
      chatbotInput: createFakeElement({ value: '' }),
      chatbotSend: createFakeElement(),
      chatbotMessages: createFakeElement(),
    };

    quickQButtons = [
      createFakeElement({ getAttribute: jest.fn(() => 'What is the time complexity?') }),
      createFakeElement({ getAttribute: jest.fn(() => 'Can you give me a hint?') }),
    ];

    originalDocument = global.document;
    originalWindow = global.window;

    global.window = {
      chatbotResponses: { default: 'Try breaking the problem down.' },
      userProgress: {},
    };
    global.document = {
      getElementById: jest.fn((id) => elements[id] || null),
      querySelectorAll: jest.fn((selector) => (selector === '.quick-q' ? quickQButtons : [])),
      createElement: jest.fn(() => createFakeElement()),
      head: { appendChild: jest.fn() },
    };
  });

  afterEach(() => {
    global.document = originalDocument;
    global.window = originalWindow;
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('disables send controls while a response is pending, then re-enables them', async () => {
    const { initChatbot } = await import('../modules/chatbot.js');
    initChatbot();

    elements.chatbotInput.value = 'How do I solve this?';
    elements.chatbotSend.dispatch('click');

    // Immediately after sending, controls should be disabled.
    expect(elements.chatbotSend.disabled).toBe(true);
    expect(quickQButtons[0].disabled).toBe(true);
    expect(quickQButtons[1].disabled).toBe(true);

    jest.advanceTimersByTime(1000);

    // After the bot "responds", controls should be re-enabled.
    expect(elements.chatbotSend.disabled).toBe(false);
    expect(quickQButtons[0].disabled).toBe(false);
  });

  it('ignores a second send while a response is still pending', async () => {
    const { initChatbot, addChatMessage: _unused } = await import('../modules/chatbot.js');
    initChatbot();

    elements.chatbotInput.value = 'First question';
    elements.chatbotSend.dispatch('click');

    const appendCallsAfterFirstSend = elements.chatbotMessages.appendChild.mock.calls.length;

    // Attempt a second send before the first response resolves.
    elements.chatbotInput.value = 'Second question';
    elements.chatbotSend.dispatch('click');

    // No additional message/loading element should have been appended yet.
    expect(elements.chatbotMessages.appendChild.mock.calls.length).toBe(appendCallsAfterFirstSend);

    jest.advanceTimersByTime(1000);

    // Now that the first response resolved, a new send should work again.
    elements.chatbotInput.value = 'Third question';
    elements.chatbotSend.dispatch('click');
    expect(elements.chatbotMessages.appendChild.mock.calls.length).toBeGreaterThan(
      appendCallsAfterFirstSend
    );
  });

  it('rapid clicks on two different quick-question buttons only trigger one pending response', () => {
    return import('../modules/chatbot.js').then(({ initChatbot }) => {
      initChatbot();

      const appendChildSpy = elements.chatbotMessages.appendChild;

      quickQButtons[0].dispatch('click');
      const countAfterFirstClick = appendChildSpy.mock.calls.length;

      quickQButtons[1].dispatch('click');
      // Second quick-question click while pending should be a no-op.
      expect(appendChildSpy.mock.calls.length).toBe(countAfterFirstClick);
    });
  });
});
