import crypto from 'crypto';

/**
 * Validates a CSRF token using the Double-Submit Cookie pattern.
 * Compares the token from the request header against the signed secret in the HttpOnly cookie.
 */
export function verifyCsrfToken(req) {
    try {
        // 1. Extract the secret from the HttpOnly cookie
        const cookies = req.headers.cookie || '';
        const match = cookies.match(/csrfSecret=([^;]+)/);
        const secret = match ? match[1] : null;
        
        // 2. Extract the token provided by the frontend in the headers
        const token = req.headers['x-csrf-token'] || req.body?.csrfToken;

        // If either is missing, the request is invalid
        if (!secret || !token) {
            return false;
        }

        // 3. Recreate the expected token hash using the cookie's secret
        const expectedToken = crypto.createHmac('sha256', process.env.CSRF_SALT || 'infinity-verse-secure-salt')
                                    .update(secret)
                                    .digest('hex');
                                    
        // 4. Use timingSafeEqual to prevent timing side-channel attacks
        const tokenBuffer = Buffer.from(token);
        const expectedBuffer = Buffer.from(expectedToken);
        
        if (tokenBuffer.length !== expectedBuffer.length) {
            return false;
        }
        
        return crypto.timingSafeEqual(tokenBuffer, expectedBuffer);
    } catch (error) {
        console.error('CSRF Verification Error:', error);
        return false;
    }
}
