import { escapeHtml, sanitizeHTML } from '../modules/domSanitizer.js';

describe('DOMSanitizer - escapeHtml', () => {
  it('escapes basic HTML characters', () => {
    expect(escapeHtml('<script>alert("hello")</script>')).toBe('&lt;script&gt;alert(&quot;hello&quot;)&lt;/script&gt;');
    expect(escapeHtml('Hello & Welcome')).toBe('Hello &amp; Welcome');
    expect(escapeHtml("John's Book")).toBe('John&#39;s Book');
  });

  it('handles null and undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('handles non-string inputs', () => {
    expect(escapeHtml(123)).toBe('123');
    expect(escapeHtml(true)).toBe('true');
  });
});

describe('DOMSanitizer - sanitizeHTML', () => {
  it('removes script tags', () => {
    const input = '<div>Hello <script>alert(1)</script>World</div>';
    const expected = '<div>Hello World</div>';
    expect(sanitizeHTML(input)).toBe(expected);
  });

  it('strips onerror and other event handlers', () => {
    const input = '<img src="x" onerror="alert(1)" onload="javascript:alert(2)">';
    const expected = '<img src="x">';
    expect(sanitizeHTML(input)).toBe(expected);
  });

  it('removes javascript: URIs', () => {
    const input = '<a href="javascript:alert(1)">Click here</a>';
    const expected = '<a>Click here</a>';
    expect(sanitizeHTML(input)).toBe(expected);
  });

  it('preserves allowed tags and safe attributes', () => {
    const input = '<div class="test" id="main"><b>Bold text</b></div>';
    expect(sanitizeHTML(input)).toBe(input);
  });

  it('handles null and undefined', () => {
    expect(sanitizeHTML(null)).toBe('');
    expect(sanitizeHTML(undefined)).toBe('');
  });
});
