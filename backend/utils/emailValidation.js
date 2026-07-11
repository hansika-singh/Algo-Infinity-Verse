// utils/emailValidation.js

/**
 * Validates and normalizes an email address.
 * @param {string} email - The raw email input.
 * @returns {Object} - { valid: boolean, normalizedEmail: string, error: string | null }
 */
export function validateAndNormalizeEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, normalizedEmail: '', error: 'Email is required.' };
  }

  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { valid: false, normalizedEmail: '', error: 'Email is required.' };
  }

  // Stronger Regex (supports + signs, subdomains, new TLDs)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(normalized)) {
    return { valid: false, normalizedEmail: normalized, error: 'Enter a valid email address.' };
  }

  return { valid: true, normalizedEmail: normalized, error: null };
}