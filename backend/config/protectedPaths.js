// config/protectedPaths.js

/**
 * List of protected static file paths that require authentication.
 */
export const protectedPaths = new Set([
  '/community',
  '/community.html',
  '/support-page',
  '/support-page/',
  '/support-page/index.html',
]);
