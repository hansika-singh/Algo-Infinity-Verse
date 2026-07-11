// config/passwordBlacklist.js

/**
 * List of common and weak passwords.
 * This list is used to prevent users from choosing easily guessable passwords.
 * 
 * ✅ PERFORMANCE IMPROVEMENT: Using Set instead of Array for O(1) lookups
 * Array.includes() = O(n) - Linear search
 * Set.has() = O(1) - Constant time lookup
 */

export const commonPasswords = new Set([
  "password123",
  "password1234",
  "password12345",
  "12345678",
  "123456789",
  "qwerty123",
  "qwertyuiop",
  "admin123",
  "letmein123",
  "welcome123",
  "monkey123",
  "1234567890",
  "abcdefgh",
  "abc12345",
  "password1",
  "passw0rd",
  "p@ssw0rd",
  "P@ssw0rd",
  "Password123",
  "Password123!",
  "Admin@123",
  "admin@123",
]);

/**
 * Check if a password is blacklisted
 * @param {string} password - Password to check
 * @returns {boolean} - True if password is blacklisted
 */
export function isPasswordBlacklisted(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }
  // ✅ O(1) lookup using Set
  return commonPasswords.has(password);
}

/**
 * Get all blacklisted passwords as array (for backward compatibility)
 * @returns {Array} - Array of blacklisted passwords
 */
export function getBlacklistedPasswords() {
  return Array.from(commonPasswords);
}

/**
 * Add a password to the blacklist
 * @param {string} password - Password to add
 */
export function addToBlacklist(password) {
  if (password && typeof password === 'string') {
    commonPasswords.add(password);
  }
}

/**
 * Remove a password from the blacklist
 * @param {string} password - Password to remove
 * @returns {boolean} - True if password was removed
 */
export function removeFromBlacklist(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }
  return commonPasswords.delete(password);
}

/**
 * Get the total number of blacklisted passwords
 * @returns {number} - Total count
 */
export function getBlacklistCount() {
  return commonPasswords.size;
}