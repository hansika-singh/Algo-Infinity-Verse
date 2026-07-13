import { jest } from '@jest/globals';
import { validateEnv } from '../utils/envValidator.js';

describe('Environment Validator', () => {
  let originalEnv;
  let mockExit;
  let mockConsoleError;

  beforeEach(() => {
    originalEnv = { ...process.env };
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should pass if SESSION_SECRET is present', () => {
    process.env.SESSION_SECRET = 'some-secret-key';
    expect(() => validateEnv()).not.toThrow();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should throw an error on Vercel if SESSION_SECRET is missing', () => {
    delete process.env.SESSION_SECRET;
    process.env.VERCEL = '1';

    expect(() => validateEnv()).toThrow(/SESSION_SECRET is required on Vercel/);
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should terminate the process in non-Vercel environment if SESSION_SECRET is missing', () => {
    delete process.env.SESSION_SECRET;
    delete process.env.VERCEL;

    validateEnv();

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining('FATAL: SESSION_SECRET is required')
    );
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
