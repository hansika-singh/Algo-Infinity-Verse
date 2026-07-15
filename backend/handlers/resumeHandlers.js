import multer from 'multer';
import { sendJson, getSession } from '../utils/helpers.js';
import { extractResumeText } from '../resume-analyzer/parser.js';
import { calculateATS } from '../resume-analyzer/atsScore.js';
import { findMissingSkills } from '../resume-analyzer/skills.js';
import { getSuggestions } from '../resume-analyzer/suggestions.js';
import securityConfig from '../config/security.js';

const MAX_RESUME_FILE_SIZE_BYTES = securityConfig.MAX_RESUME_FILE_SIZE_BYTES;
const MAX_RESUME_TEXT_LENGTH = securityConfig.MAX_RESUME_TEXT_LENGTH;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_RESUME_FILE_SIZE_BYTES,
    files: 1,
  },
}).single('resume');

function handleMulterError(err) {
  // Multer-specific errors
  if (err instanceof multer.MulterError) {
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        return {
          statusCode: 413,
          error: `File too large. Maximum size is ${MAX_RESUME_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
        };
      case 'LIMIT_FILE_COUNT':
        return {
          statusCode: 400,
          error: 'Only one file can be uploaded at a time.',
        };
      case 'LIMIT_UNEXPECTED_FILE':
        return {
          statusCode: 400,
          error: 'Unexpected field name. Please use "resume" as the field name.',
        };
      case 'LIMIT_FIELD_KEY':
        return {
          statusCode: 400,
          error: 'Field name too long or contains invalid characters.',
        };
      case 'LIMIT_FIELD_VALUE':
        return {
          statusCode: 400,
          error: 'Field value too large or contains invalid data.',
        };
      case 'LIMIT_FIELD_COUNT':
        return {
          statusCode: 400,
          error: 'Too many fields in the request.',
        };
      case 'LIMIT_PART_COUNT':
        return {
          statusCode: 400,
          error: 'Too many parts in the request.',
        };
      default:
        return {
          statusCode: 400,
          error: `Upload error: ${err.message}`,
        };
    }
  }

  // File filter errors
  if (
    err.message &&
    (err.message.includes('Invalid file type') ||
      err.message.includes('Only JPEG, PNG, and WEBP images are allowed'))
  ) {
    return {
      statusCode: 415,
      error: err.message,
    };
  }

  // Unknown errors
  return {
    statusCode: 500,
    error: err.message || 'An unexpected error occurred during upload.',
  };
}

export async function handleAnalyzeResume(req, res) {
  const session = getSession(req);
  if (!session) {
    return sendJson(res, 401, { error: 'Login required.' });
  }

  try {
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (!req.file) {
      return sendJson(res, 400, { error: 'No resume file uploaded.' });
    }

    const text = await extractResumeText(req.file);

    if (text.length > MAX_RESUME_TEXT_LENGTH) {
      return sendJson(res, 400, {
        error: `Resume text is too long (${text.length} characters). Please limit your resume text to ${MAX_RESUME_TEXT_LENGTH} characters.`,
      });
    }

    const atsScore = calculateATS(text);
    const missingSkills = findMissingSkills(text);
    const suggestions = getSuggestions(atsScore);

    return sendJson(res, 200, {
      atsScore,
      missingSkills,
      suggestions,
    });
  } catch (error) {
    console.error('Resume analysis error:', error);

    // Handle Multer-specific errors
    if (error.code && error.code.startsWith('LIMIT_')) {
      const handled = handleMulterError(error);
      return sendJson(res, handled.statusCode, { error: handled.error });
    }

    // Handle file filter errors
    if (
      error.message &&
      (error.message.includes('Invalid file type') ||
        error.message.includes('Only JPEG, PNG, and WEBP images are allowed'))
    ) {
      const handled = handleMulterError(error);
      return sendJson(res, handled.statusCode, { error: handled.error });
    }

    if (error.message === 'Resume text extraction timed out.') {
      return sendJson(res, 408, {
        error:
          'The request took too long to process. The resume file might be corrupted or too complex.',
      });
    }

    return sendJson(res, 500, {
      error: error.message || 'Failed to analyze resume.',
    });
  }
}

export function handleUploadError(error) {
  return handleMulterError(error);
}
