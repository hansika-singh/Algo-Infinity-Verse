export const MAX_RESUME_TEXT_LENGTH = parseInt(process.env.MAX_RESUME_TEXT_LENGTH) || 50000;
export const MAX_RESUME_FILE_SIZE_BYTES =
  parseInt(process.env.MAX_RESUME_FILE_SIZE_BYTES) || 5 * 1024 * 1024;
export const MIN_RESUME_TEXT_LENGTH = parseInt(process.env.MIN_RESUME_TEXT_LENGTH) || 10;

export const RESUME_CONSTANTS = {
  MAX_TEXT_LENGTH: MAX_RESUME_TEXT_LENGTH,
  MAX_FILE_SIZE_BYTES: MAX_RESUME_FILE_SIZE_BYTES,
  MIN_TEXT_LENGTH: MIN_RESUME_TEXT_LENGTH,
  ALLOWED_FILE_TYPES: ['pdf', 'docx', 'txt', 'doc'],
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/msword',
  ],
};

export default RESUME_CONSTANTS;
