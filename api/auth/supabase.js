/**
 * Dedicated Vercel serverless function for the Supabase auth exchange.
 *
 * The api/[...path].js catch-all normally delegates this to server.js's
 * requestHandler, but registering an exact-match function guarantees the route
 * is served on Vercel regardless of catch-all path resolution.
 *
 * This module exports a serverless handler that processes authentication
 * requests for Supabase and delegates them to the main requestHandler.
 *
 * @module api/auth/supabase
 * @requires ../server.js
 */

import { requestHandler } from '../server.js';

/**
 * Vercel serverless function configuration.
 * Disables the default bodyParser to allow raw request body handling
 * for file uploads and multipart form data.
 *
 * @type {Object}
 * @property {Object} api - API route configuration
 * @property {boolean} api.bodyParser - Whether to use default body parser
 *
 * @example
 * // Disables body parsing for file uploads
 * export const config = {
 *   api: {
 *     bodyParser: false,
 *   },
 * };
 */
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Serverless handler function for Supabase authentication endpoints.
 *
 * This function acts as the entry point for all authentication-related
 * API calls to Supabase. It receives incoming HTTP requests, processes
 * them through the requestHandler, and returns appropriate responses.
 *
 * @param {Object} req - The HTTP request object
 * @param {Object} req.method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {Object} req.url - The request URL
 * @param {Object} req.headers - HTTP headers
 * @param {Object|string} req.body - Request body data
 * @param {Object} res - The HTTP response object
 * @param {Function} res.status - Function to set HTTP status code
 * @param {Function} res.json - Function to send JSON response
 * @param {Function} res.send - Function to send response
 * @param {Function} res.setHeader - Function to set response headers
 * @param {Function} res.end - Function to end the response
 * @returns {Promise<void>} A promise that resolves when the request is handled
 *
 * @example
 * // Example usage in Vercel serverless environment
 * // POST /api/auth/supabase/login
 * // Body: { email: 'user@example.com', password: 'secure123' }
 *
 * @example
 * // Example API call for signup
 * // POST /api/auth/supabase/signup
 * // Body: { email: 'user@example.com', password: 'secure123', name: 'John Doe' }
 */
export default function handler(req, res) {
  return requestHandler(req, res);
}
