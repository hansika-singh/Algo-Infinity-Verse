/**
 * Validates the required environment variables.
 * Throws or terminates the application if any required variable is missing.
 */
export function validateEnv() {
  if (!process.env.SESSION_SECRET) {
    if (process.env.VERCEL === '1') {
      throw new Error(
        'FATAL: SESSION_SECRET is required on Vercel. Set it in the Vercel dashboard under Project Settings > Environment Variables.'
      );
    } else {
      console.error(
        'FATAL: SESSION_SECRET is required. Set it in the environment before starting the server.'
      );
      process.exit(1);
    }
  }
}
