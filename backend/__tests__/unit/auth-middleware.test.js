const jwt = require('jsonwebtoken');
const authMiddleware = require('../../middleware/auth');

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('Admin Authentication Middleware Tests', () => {
    let req, res, next;
    const SECRET_KEY = process.env.SECRET_KEY || 'test-secret-key';

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock request object
        req = {
            headers: {}
        };

        // Mock response object
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        // Mock next function
        next = jest.fn();
    });

    // ==================== SUCCESSFUL AUTHENTICATION TESTS ====================

    it('should authenticate valid token successfully', () => {
        const token = 'valid.jwt.token';
        const decoded = { id: '123', email: 'admin@example.com', role: 'Admin' };

        req.headers.authorization = `Bearer ${token}`;
        jwt.verify.mockReturnValue(decoded);

        authMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith(token, SECRET_KEY);
        expect(req.user).toEqual(decoded);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
    });

    it('should set req.user with decoded token data', () => {
        const token = 'valid.jwt.token';
        const decoded = { 
            id: '456', 
            email: 'teacher@example.com', 
            role: 'Teacher',
            schoolId: 'school123'
        };

        req.headers.authorization = `Bearer ${token}`;
        jwt.verify.mockReturnValue(decoded);

        authMiddleware(req, res, next);

        expect(req.user).toBeDefined();
        expect(req.user).toEqual(decoded);
        expect(req.user.id).toBe('456');
        expect(req.user.email).toBe('teacher@example.com');
        expect(req.user.role).toBe('Teacher');
    });

    it('should call next() on successful authentication', () => {
        const token = 'valid.jwt.token';
        const decoded = { id: '789', email: 'user@example.com' };

        req.headers.authorization = `Bearer ${token}`;
        jwt.verify.mockReturnValue(decoded);

        authMiddleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
    });

    it('should verify token with correct secret key', () => {
        const token = 'valid.jwt.token';
        const decoded = { id: '999' };

        req.headers.authorization = `Bearer ${token}`;
        jwt.verify.mockReturnValue(decoded);

        authMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith(token, SECRET_KEY);
    });

    // ==================== MISSING TOKEN TESTS ====================

    it('should return 401 when authorization header is missing', () => {
        // No authorization header set
        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Authorization token is missing'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header is undefined', () => {
        req.headers.authorization = undefined;

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Authorization token is missing'
        });
    });

    it('should return 401 when authorization header is null', () => {
        req.headers.authorization = null;

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Authorization token is missing'
        });
    });

    it('should return 401 when authorization header is empty string', () => {
        req.headers.authorization = '';

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Authorization token is missing'
        });
    });

    // ==================== INVALID TOKEN FORMAT TESTS ====================

    it('should return 401 for token without Bearer prefix', () => {
        req.headers.authorization = 'valid.jwt.token';

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid token format'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for malformed Bearer token', () => {
        req.headers.authorization = 'Bearer';

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid token format'
        });
    });

    it('should return 401 for token with wrong prefix', () => {
        req.headers.authorization = 'Basic valid.jwt.token';

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid token format'
        });
    });

    it('should return 401 for token with lowercase bearer', () => {
        req.headers.authorization = 'bearer valid.jwt.token';

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid token format'
        });
    });

    it('should return 401 for token with extra parts', () => {
        req.headers.authorization = 'Bearer token extra.part';

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid token format'
        });
    });

    it('should return 401 for token with multiple spaces', () => {
        req.headers.authorization = 'Bearer  valid.jwt.token';

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid token format'
        });
    });

    // ==================== INVALID TOKEN TESTS ====================

    it('should return 401 for invalid token', () => {
        const token = 'invalid.jwt.token';
        req.headers.authorization = `Bearer ${token}`;

        jwt.verify.mockImplementation(() => {
            throw new Error('Invalid token');
        });

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid token'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for tampered token', () => {
        const token = 'tampered.jwt.token';
        req.headers.authorization = `Bearer ${token}`;

        jwt.verify.mockImplementation(() => {
            const error = new Error('jwt malformed');
            throw error;
        });

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid token'
        });
    });

    it('should return 401 for token with invalid signature', () => {
        const token = 'invalid.signature.token';
        req.headers.authorization = `Bearer ${token}`;

        jwt.verify.mockImplementation(() => {
            const error = new Error('invalid signature');
            throw error;
        });

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid token'
        });
    });

    // ==================== EXPIRED TOKEN TESTS ====================

    it('should return 401 for expired token', () => {
        const token = 'expired.jwt.token';
        req.headers.authorization = `Bearer ${token}`;

        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        jwt.verify.mockImplementation(() => {
            throw error;
        });

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Token has expired'
        });
        expect(next).not.toHaveBeenCalled();
    });

    it('should handle TokenExpiredError with specific message', () => {
        const token = 'expired.jwt.token';
        req.headers.authorization = `Bearer ${token}`;

        const error = new Error('Token expired at specific time');
        error.name = 'TokenExpiredError';
        error.expiredAt = new Date();
        jwt.verify.mockImplementation(() => {
            throw error;
        });

        authMiddleware(req, res, next);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/expired/i)
            })
        );
    });

    it('should differentiate between expired and invalid tokens', () => {
        const expiredToken = 'expired.jwt.token';
        const invalidToken = 'invalid.jwt.token';

        // Test expired token
        req.headers.authorization = `Bearer ${expiredToken}`;
        const expiredError = new Error('jwt expired');
        expiredError.name = 'TokenExpiredError';
        jwt.verify.mockImplementationOnce(() => {
            throw expiredError;
        });

        authMiddleware(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ message: 'Token has expired' });

        // Reset mocks
        res.status.mockClear();
        res.json.mockClear();

        // Test invalid token
        req.headers.authorization = `Bearer ${invalidToken}`;
        jwt.verify.mockImplementationOnce(() => {
            throw new Error('Invalid token');
        });

        authMiddleware(req, res, next);

        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid token' });
    });

    // ==================== EDGE CASES ====================

    it('should handle token with special characters', () => {
        const token = 'token.with-special_chars.123';
        const decoded = { id: 'special123' };

        req.headers.authorization = `Bearer ${token}`;
        jwt.verify.mockReturnValue(decoded);

        authMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith(token, SECRET_KEY);
        expect(next).toHaveBeenCalled();
    });

    it('should handle very long tokens', () => {
        const token = 'a'.repeat(1000);
        const decoded = { id: 'longtoken' };

        req.headers.authorization = `Bearer ${token}`;
        jwt.verify.mockReturnValue(decoded);

        authMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith(token, SECRET_KEY);
        expect(next).toHaveBeenCalled();
    });

    it('should handle minimal decoded payload', () => {
        const token = 'valid.jwt.token';
        const decoded = { id: '1' };

        req.headers.authorization = `Bearer ${token}`;
        jwt.verify.mockReturnValue(decoded);

        authMiddleware(req, res, next);

        expect(req.user).toEqual({ id: '1' });
        expect(next).toHaveBeenCalled();
    });

    it('should handle complex decoded payload', () => {
        const token = 'valid.jwt.token';
        const decoded = {
            id: '123',
            email: 'admin@example.com',
            role: 'Admin',
            permissions: ['read', 'write', 'delete'],
            schoolId: 'school456',
            iat: 1234567890,
            exp: 1234567890
        };

        req.headers.authorization = `Bearer ${token}`;
        jwt.verify.mockReturnValue(decoded);

        authMiddleware(req, res, next);

        expect(req.user).toEqual(decoded);
        expect(req.user.permissions).toEqual(['read', 'write', 'delete']);
        expect(next).toHaveBeenCalled();
    });

    it('should handle token with extra whitespace in header', () => {
        const token = 'valid.jwt.token';
        req.headers.authorization = `  Bearer ${token}  `;

        authMiddleware(req, res, next);

        // Should fail because of leading whitespace
        expect(res.status).toHaveBeenCalledWith(401);
    });

    // ==================== SECURITY TESTS ====================

    it('should not expose sensitive error details', () => {
        const token = 'invalid.jwt.token';
        req.headers.authorization = `Bearer ${token}`;

        jwt.verify.mockImplementation(() => {
            throw new Error('Detailed internal error with sensitive data');
        });

        authMiddleware(req, res, next);

        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid token'
        });
        // Should not expose the detailed error message
        expect(res.json).not.toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('sensitive data')
            })
        );
    });

    it('should not allow token reuse after expiration', () => {
        const token = 'expired.jwt.token';
        req.headers.authorization = `Bearer ${token}`;

        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        jwt.verify.mockImplementation(() => {
            throw error;
        });

        authMiddleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should validate token on every request', () => {
        const token = 'valid.jwt.token';
        const decoded = { id: '123' };

        req.headers.authorization = `Bearer ${token}`;
        jwt.verify.mockReturnValue(decoded);

        // First request
        authMiddleware(req, res, next);
        expect(jwt.verify).toHaveBeenCalledTimes(1);

        // Second request (new middleware instance)
        jest.clearAllMocks();
        jwt.verify.mockReturnValue(decoded);
        authMiddleware(req, res, next);
        expect(jwt.verify).toHaveBeenCalledTimes(1);
    });

    // ==================== CASE SENSITIVITY TESTS ====================

    it('should be case-sensitive for Bearer prefix', () => {
        req.headers.authorization = 'BEARER valid.jwt.token';

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Invalid token format'
        });
    });

    it('should handle authorization header with mixed case', () => {
        req.headers.Authorization = 'Bearer valid.jwt.token';
        // Most frameworks normalize headers to lowercase, but test both
        const decoded = { id: '123' };
        jwt.verify.mockReturnValue(decoded);

        authMiddleware(req, res, next);

        // This should fail because we're checking req.headers.authorization (lowercase)
        expect(res.status).toHaveBeenCalledWith(401);
    });

    // ==================== CONCURRENT REQUEST TESTS ====================

    it('should handle multiple concurrent authentication requests', () => {
        const token1 = 'token1.jwt.token';
        const token2 = 'token2.jwt.token';
        const decoded1 = { id: '1', email: 'user1@example.com' };
        const decoded2 = { id: '2', email: 'user2@example.com' };

        // First request
        req.headers.authorization = `Bearer ${token1}`;
        jwt.verify.mockReturnValueOnce(decoded1);
        authMiddleware(req, res, next);
        expect(req.user).toEqual(decoded1);

        // Second request (new req object)
        const req2 = { headers: { authorization: `Bearer ${token2}` } };
        const res2 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        const next2 = jest.fn();

        jwt.verify.mockReturnValueOnce(decoded2);
        authMiddleware(req2, res2, next2);
        expect(req2.user).toEqual(decoded2);
    });

    // ==================== ERROR HANDLING TESTS ====================

    it('should handle unexpected errors gracefully', () => {
        const token = 'valid.jwt.token';
        req.headers.authorization = `Bearer ${token}`;

        jwt.verify.mockImplementation(() => {
            throw new Error('Unexpected error occurred');
        });

        authMiddleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalled();
    });

    it('should not crash on null token verification response', () => {
        const token = 'valid.jwt.token';
        req.headers.authorization = `Bearer ${token}`;

        jwt.verify.mockReturnValue(null);

        authMiddleware(req, res, next);

        expect(req.user).toBe(null);
        expect(next).toHaveBeenCalled();
    });

    it('should handle empty decoded payload', () => {
        const token = 'valid.jwt.token';
        req.headers.authorization = `Bearer ${token}`;

        jwt.verify.mockReturnValue({});

        authMiddleware(req, res, next);

        expect(req.user).toEqual({});
        expect(next).toHaveBeenCalled();
    });

    // ==================== INTEGRATION-LIKE TESTS ====================

    it('should extract and verify token correctly from authorization header', () => {
        const originalToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMyJ9.abc';
        const decoded = { id: '123' };

        req.headers.authorization = `Bearer ${originalToken}`;
        jwt.verify.mockReturnValue(decoded);

        authMiddleware(req, res, next);

        expect(jwt.verify).toHaveBeenCalledWith(originalToken, SECRET_KEY);
    });

    it('should not modify request object if authentication fails', () => {
        req.headers.authorization = 'invalid format';
        const originalReq = { ...req };

        authMiddleware(req, res, next);

        expect(req.user).toBeUndefined();
        expect(req.headers).toEqual(originalReq.headers);
    });

    it('should properly set req.user only on successful authentication', () => {
        const token = 'valid.jwt.token';
        const decoded = { id: '999', role: 'Admin' };

        req.headers.authorization = `Bearer ${token}`;
        jwt.verify.mockReturnValue(decoded);

        expect(req.user).toBeUndefined();

        authMiddleware(req, res, next);

        expect(req.user).toBeDefined();
        expect(req.user).toEqual(decoded);
    });

    it('should call next exactly once on success', () => {
        const token = 'valid.jwt.token';
        const decoded = { id: '123' };

        req.headers.authorization = `Bearer ${token}`;
        jwt.verify.mockReturnValue(decoded);

        authMiddleware(req, res, next);

        expect(next).toHaveBeenCalledTimes(1);
        expect(next.mock.calls[0]).toEqual([]);
    });

    it('should never call next on authentication failure', () => {
        const testCases = [
            { authorization: undefined, reason: 'missing token' },
            { authorization: '', reason: 'empty token' },
            { authorization: 'NoBearer token', reason: 'invalid format' },
            { authorization: 'Bearer', reason: 'malformed bearer' }
        ];

        testCases.forEach(({ authorization, reason }) => {
            req.headers.authorization = authorization;
            next.mockClear();

            authMiddleware(req, res, next);

            expect(next).not.toHaveBeenCalled();
        });
    });
});
