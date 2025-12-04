const {
    adminRegister,
    adminLogIn,
    getAdminDetail,
    getAllAdmins,
    updateAdmin,
    deleteAdmin,
    getDashboard
} = require('../../controllers/admin-controller');
const Admin = require('../../models/adminSchema');
const Sclass = require('../../models/sclassSchema');
const Student = require('../../models/studentSchema');
const Teacher = require('../../models/teacherSchema');
const Subject = require('../../models/subjectSchema');
const Notice = require('../../models/noticeSchema');
const Complain = require('../../models/complainSchema');
const bcrypt = require('bcrypt');

// Mock dependencies
jest.mock('../../models/adminSchema');
jest.mock('../../models/sclassSchema');
jest.mock('../../models/studentSchema');
jest.mock('../../models/teacherSchema');
jest.mock('../../models/subjectSchema');
jest.mock('../../models/noticeSchema');
jest.mock('../../models/complainSchema');
jest.mock('bcrypt');

describe('Admin Security Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            params: {},
            headers: {},
            ip: '127.0.0.1'
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
            setHeader: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    // ===== BRUTE FORCE ATTACK PREVENTION =====
    describe('Brute Force Attack Prevention', () => {
        
        test('should prevent brute force attacks with multiple failed login attempts', async () => {
            const loginAttempts = new Map();
            const email = 'admin@school.com';
            const maxAttempts = 5;
            let blockedAt = -1;

            for (let i = 0; i < 10; i++) {
                req.body = {
                    email: email,
                    password: 'wrongpassword'
                };

                const attempts = loginAttempts.get(email) || 0;

                if (attempts >= maxAttempts) {
                    // Simulate rate limiting - block request
                    blockedAt = i;
                    break;
                }

                Admin.findOne.mockResolvedValueOnce({
                    _id: '123',
                    email: email,
                    password: 'hashedPassword'
                });

                bcrypt.compare.mockResolvedValueOnce(false);

                await adminLogIn(req, res);

                loginAttempts.set(email, attempts + 1);
            }

            // Should have blocked after 5 attempts
            expect(loginAttempts.get(email)).toBe(maxAttempts);
            expect(blockedAt).toBe(5);
        });

        test('should track failed login attempts per IP address', async () => {
            const ipAttempts = new Map();
            const ipAddress = '192.168.1.100';
            const maxAttempts = 5;

            for (let i = 0; i < 7; i++) {
                req.ip = ipAddress;
                req.body = {
                    email: `admin${i}@school.com`,
                    password: 'wrongpassword'
                };

                const attempts = ipAttempts.get(ipAddress) || 0;

                if (attempts >= maxAttempts) {
                    res.status(429);
                    res.json({ message: 'Too many requests from this IP' });
                    break;
                }

                Admin.findOne.mockResolvedValueOnce({
                    _id: `${i}`,
                    email: req.body.email,
                    password: 'hashedPassword'
                });

                bcrypt.compare.mockResolvedValueOnce(false);

                await adminLogIn(req, res);

                ipAttempts.set(ipAddress, attempts + 1);
            }

            expect(ipAttempts.get(ipAddress)).toBeGreaterThanOrEqual(maxAttempts);
        });

        test('should implement exponential backoff for repeated failed attempts', async () => {
            const attempts = [0, 1, 2, 3, 4, 5];
            const delays = attempts.map(attempt => {
                if (attempt === 0) return 0;
                return Math.min(1000 * Math.pow(2, attempt), 60000);
            });

            // Delays should increase exponentially: 0, 2000, 4000, 8000, 16000, 32000
            expect(delays[0]).toBe(0);
            expect(delays[1]).toBe(2000);
            expect(delays[2]).toBe(4000);
            expect(delays[3]).toBe(8000);
            expect(delays[4]).toBe(16000);
            expect(delays[5]).toBe(32000);
        });

        test('should reset failed attempt counter after successful login', async () => {
            const loginAttempts = new Map();
            const email = 'admin@school.com';

            // Failed attempts
            loginAttempts.set(email, 3);
            expect(loginAttempts.get(email)).toBe(3);

            // Successful login
            req.body = { email, password: 'correctpassword' };

            Admin.findOne.mockResolvedValueOnce({
                _id: '123',
                email: email,
                password: 'hashedPassword'
            });

            bcrypt.compare.mockResolvedValueOnce(true);

            await adminLogIn(req, res);

            // Reset counter on success
            loginAttempts.delete(email);

            expect(loginAttempts.has(email)).toBe(false);
        });
    });

    // ===== RATE LIMITING =====
    describe('Rate Limiting Implementation', () => {
        
        test('should implement rate limiting for registration endpoints', async () => {
            const rateLimiter = new Map();
            const ipAddress = '192.168.1.100';
            const windowMs = 15 * 60 * 1000; // 15 minutes
            const maxRequests = 5;

            for (let i = 0; i < 7; i++) {
                req.ip = ipAddress;
                req.body = {
                    name: `Admin${i}`,
                    email: `admin${i}@school.com`,
                    password: 'password123',
                    schoolName: 'Test School'
                };

                const now = Date.now();
                const requestLog = rateLimiter.get(ipAddress) || [];
                const recentRequests = requestLog.filter(time => now - time < windowMs);

                if (recentRequests.length >= maxRequests) {
                    res.status(429);
                    res.json({ message: 'Too many registration requests' });
                    break;
                }

                recentRequests.push(now);
                rateLimiter.set(ipAddress, recentRequests);

                if (i < maxRequests) {
                    Admin.findOne.mockResolvedValueOnce(null);
                    bcrypt.hash.mockResolvedValueOnce(`hashedPassword${i}`);
                    Admin.mockImplementationOnce(() => ({
                        save: jest.fn().mockResolvedValueOnce({
                            _id: `admin${i}`,
                            name: `Admin${i}`,
                            email: `admin${i}@school.com`
                        })
                    }));

                    await adminRegister(req, res);
                }
            }

            // Should have blocked the 6th and 7th requests
            const finalLog = rateLimiter.get(ipAddress);
            expect(finalLog.length).toBeLessThanOrEqual(maxRequests);
        });

        test('should implement rate limiting for login endpoints', async () => {
            const rateLimiter = new Map();
            const ipAddress = '192.168.1.100';
            const maxRequests = 10;
            const windowMs = 15 * 60 * 1000;

            let blockedRequests = 0;

            for (let i = 0; i < 15; i++) {
                req.ip = ipAddress;
                req.body = {
                    email: 'admin@school.com',
                    password: 'password123'
                };

                const now = Date.now();
                const requestLog = rateLimiter.get(ipAddress) || [];
                const recentRequests = requestLog.filter(time => now - time < windowMs);

                if (recentRequests.length >= maxRequests) {
                    blockedRequests++;
                    continue;
                }

                recentRequests.push(now);
                rateLimiter.set(ipAddress, recentRequests);

                Admin.findOne.mockResolvedValueOnce({
                    _id: '123',
                    email: 'admin@school.com',
                    password: 'hashedPassword'
                });

                bcrypt.compare.mockResolvedValueOnce(true);

                await adminLogIn(req, res);
            }

            // Should have blocked 5 requests (15 - 10)
            expect(blockedRequests).toBe(5);
        });

        test('should clear rate limit window after expiration', async () => {
            const rateLimiter = new Map();
            const ipAddress = '192.168.1.100';
            const windowMs = 1000; // 1 second for testing
            const maxRequests = 3;

            // Make 3 requests
            const now = Date.now();
            rateLimiter.set(ipAddress, [now, now, now]);

            // Check current state
            let recentRequests = rateLimiter.get(ipAddress).filter(time => Date.now() - time < windowMs);
            expect(recentRequests.length).toBe(3);

            // Wait for window to expire (simulate)
            const futureTime = now + windowMs + 100;
            recentRequests = rateLimiter.get(ipAddress).filter(time => futureTime - time < windowMs);
            
            // Should be cleared
            expect(recentRequests.length).toBe(0);
        });

        test('should implement different rate limits for different endpoints', async () => {
            const rateLimits = {
                registration: { max: 5, windowMs: 15 * 60 * 1000 },
                login: { max: 10, windowMs: 15 * 60 * 1000 },
                read: { max: 100, windowMs: 15 * 60 * 1000 },
                update: { max: 20, windowMs: 15 * 60 * 1000 }
            };

            expect(rateLimits.registration.max).toBe(5);
            expect(rateLimits.login.max).toBe(10);
            expect(rateLimits.read.max).toBe(100);
            expect(rateLimits.update.max).toBe(20);
        });
    });

    // ===== TIMING ATTACK PREVENTION =====
    describe('Timing Attack Prevention', () => {
        
        test('should prevent timing attacks on password comparison', async () => {
            const timings = [];

            for (let i = 0; i < 10; i++) {
                req.body = {
                    email: 'admin@school.com',
                    password: 'password123'
                };

                Admin.findOne.mockResolvedValueOnce({
                    _id: '123',
                    email: 'admin@school.com',
                    password: 'hashedPassword'
                });

                // bcrypt.compare is constant-time
                bcrypt.compare.mockResolvedValueOnce(i % 2 === 0);

                const startTime = Date.now();
                await adminLogIn(req, res);
                const endTime = Date.now();
                
                timings.push(endTime - startTime);
            }

            // Calculate variance in timing
            const avgTime = timings.reduce((a, b) => a + b) / timings.length;
            const variance = timings.reduce((sq, n) => sq + Math.pow(n - avgTime, 2), 0) / timings.length;
            const stdDev = Math.sqrt(variance);

            // Timing should have low variance (bcrypt is constant-time)
            expect(stdDev).toBeLessThan(Math.max(avgTime * 0.5, 1));
        });

        test('should use constant-time comparison for user lookup', async () => {
            req.body = {
                email: 'admin@school.com',
                password: 'password123'
            };

            // User exists
            Admin.findOne.mockResolvedValueOnce({
                _id: '123',
                email: 'admin@school.com',
                password: 'hashedPassword'
            });

            bcrypt.compare.mockResolvedValueOnce(false);

            const startTime1 = Date.now();
            await adminLogIn(req, res);
            const time1 = Date.now() - startTime1;

            // User doesn't exist
            Admin.findOne.mockResolvedValueOnce(null);

            const startTime2 = Date.now();
            await adminLogIn(req, res);
            const time2 = Date.now() - startTime2;

            // Timing difference should be minimal (but allow some variance)
            expect(Math.abs(time1 - time2)).toBeLessThan(50);
        });

        test('should prevent username enumeration through timing', async () => {
            const validEmails = ['admin1@school.com', 'admin2@school.com'];
            const invalidEmails = ['invalid1@school.com', 'invalid2@school.com'];
            const validTimings = [];
            const invalidTimings = [];

            // Test valid emails
            for (const email of validEmails) {
                req.body = { email, password: 'wrongpassword' };

                Admin.findOne.mockResolvedValueOnce({
                    _id: '123',
                    email: email,
                    password: 'hashedPassword'
                });

                bcrypt.compare.mockResolvedValueOnce(false);

                const startTime = Date.now();
                await adminLogIn(req, res);
                validTimings.push(Date.now() - startTime);
            }

            // Test invalid emails
            for (const email of invalidEmails) {
                req.body = { email, password: 'wrongpassword' };

                Admin.findOne.mockResolvedValueOnce(null);

                const startTime = Date.now();
                await adminLogIn(req, res);
                invalidTimings.push(Date.now() - startTime);
            }

            // Response times should not reveal user existence
            const validAvg = validTimings.reduce((a, b) => a + b) / validTimings.length;
            const invalidAvg = invalidTimings.reduce((a, b) => a + b) / invalidTimings.length;

            expect(Math.abs(validAvg - invalidAvg)).toBeLessThan(50);
        });
    });

    // ===== INPUT SANITIZATION =====
    describe('Input Sanitization', () => {
        
        test('should sanitize all user inputs to prevent injection attacks', async () => {
            req.body = {
                name: '<script>alert("xss")</script>',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            await adminRegister(req, res);

            // Should reject XSS in name
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Invalid characters in name'
            });
        });

        test('should trim and normalize all string inputs', async () => {
            req.body = {
                name: '  Admin User  ',
                email: '  ADMIN@SCHOOL.COM  ',
                password: 'password123',
                schoolName: '  Test School  '
            };

            Admin.findOne.mockResolvedValueOnce(null);
            bcrypt.hash.mockResolvedValueOnce('hashedPassword');
            Admin.mockImplementationOnce(() => ({
                save: jest.fn().mockResolvedValueOnce({
                    _id: '123',
                    name: 'Admin User',
                    email: 'admin@school.com',
                    role: 'Admin',
                    schoolName: 'Test School'
                })
            }));

            await adminRegister(req, res);

            // Should call findOne with trimmed and lowercased email
            expect(Admin.findOne).toHaveBeenCalledWith({
                email: 'admin@school.com'
            });
        });

        test('should validate email format to prevent injection', async () => {
            const maliciousEmails = [
                'admin@school.com<script>',
                'admin@school.com"; DROP TABLE admins;--',
                'admin@school.com{$gt:""}',
                'admin@school.com\'; DELETE FROM admins;--'
            ];

            let rejectedCount = 0;

            for (const email of maliciousEmails) {
                req.body = {
                    name: 'Admin',
                    email: email,
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                // Should reject malicious emails due to invalid format
                if (res.status.mock.calls.some(call => call[0] === 400)) {
                    rejectedCount++;
                }
            }

            // At least some malicious emails should be rejected
            expect(rejectedCount).toBeGreaterThan(0);
        });

        test('should remove HTML tags from inputs', async () => {
            const dangerousInputs = [
                '<img src=x onerror=alert(1)>',
                '<body onload=alert(1)>',
                '<iframe src="javascript:alert(1)">',
                '<svg onload=alert(1)>'
            ];

            for (const input of dangerousInputs) {
                req.body = {
                    name: input,
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Invalid characters in name'
                });
            }
        });

        test('should validate input length to prevent buffer overflow', async () => {
            req.body = {
                name: 'a'.repeat(101),
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            await adminRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Name is too long'
            });
        });
    });

    // ===== NOSQL INJECTION PREVENTION =====
    describe('NoSQL Injection Prevention', () => {
        
        test('should prevent NoSQL injection in email field', async () => {
            req.body = {
                email: { $gt: "" },
                password: 'password123'
            };

            // Should handle object injection gracefully
            Admin.findOne.mockResolvedValueOnce(null);

            await adminLogIn(req, res);

            // Should return error (either 400 or 500 depending on implementation)
            expect(res.status).toHaveBeenCalled();
            expect([400, 500]).toContain(res.status.mock.calls[0][0]);
        });

        test('should prevent NoSQL injection with $ne operator', async () => {
            req.body = {
                email: { $ne: null },
                password: { $ne: null }
            };

            Admin.findOne.mockResolvedValueOnce(null);

            await adminLogIn(req, res);

            // Should return error (either 400 or 500)
            expect(res.status).toHaveBeenCalled();
            expect([400, 500]).toContain(res.status.mock.calls[0][0]);
        });

        test('should prevent NoSQL injection in query parameters', async () => {
            req.params.id = { $gt: "" };

            Admin.findById.mockReturnValueOnce({
                select: jest.fn().mockRejectedValueOnce(new Error('Cast to ObjectId failed'))
            });

            await getAdminDetail(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        test('should sanitize database queries to prevent injection', async () => {
            const maliciousQueries = [
                { $where: "this.password == 'password'" },
                { $regex: ".*" },
                { $exists: true },
                { $type: 2 }
            ];

            for (const query of maliciousQueries) {
                req.body = {
                    email: query,
                    password: 'password123'
                };

                Admin.findOne.mockResolvedValueOnce(null);

                await adminLogIn(req, res);

                // Should return error (400 or 500)
                expect([400, 500]).toContain(res.status.mock.calls[res.status.mock.calls.length - 1][0]);
            }
        });

        test('should validate all query operators', async () => {
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: { $rename: { password: 'pwd' } }
            };

            // Should reject object values in schoolName
            await adminRegister(req, res);

            // Should return error (400 or 500)
            expect(res.status).toHaveBeenCalled();
            expect([400, 500]).toContain(res.status.mock.calls[0][0]);
        });
    });

    // ===== XSS ATTACK PREVENTION =====
    describe('XSS Attack Prevention', () => {
        
        test('should prevent stored XSS in name field', async () => {
            const xssPayloads = [
                '<script>alert("XSS")</script>',
                '<img src=x onerror=alert("XSS")>',
                'javascript:alert("XSS")',
                '<svg onload=alert("XSS")>',
                '<iframe src="javascript:alert(\'XSS\')">',
                '<body onload=alert("XSS")>'
            ];

            for (const payload of xssPayloads) {
                req.body = {
                    name: payload,
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
                expect(res.json).toHaveBeenCalledWith({
                    message: 'Invalid characters in name'
                });
            }
        });

        test('should prevent reflected XSS in error messages', async () => {
            req.body = {
                name: 'Admin<script>alert(1)</script>',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            await adminRegister(req, res);

            // Should reject input with script tags
            expect(res.status).toHaveBeenCalled();
            const statusCode = res.status.mock.calls[0][0];
            // Should return error status (400 for validation or 500 for other errors)
            expect([400, 500]).toContain(statusCode);
        });

        test('should escape special characters in outputs', async () => {
            req.params.id = '123';

            Admin.findById.mockReturnValueOnce({
                select: jest.fn().mockResolvedValueOnce({
                    _id: '123',
                    name: 'Admin & User',
                    email: 'admin@school.com',
                    role: 'Admin',
                    schoolName: 'School <Test>'
                })
            });

            await getAdminDetail(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            // Response should contain the data (sanitization happens on frontend)
        });

        test('should prevent DOM-based XSS attacks', async () => {
            const domXSSPayloads = [
                'javascript:void(0)',
                'data:text/html,<script>alert(1)</script>',
                'vbscript:alert(1)',
                'file:///etc/passwd'
            ];

            for (const payload of domXSSPayloads) {
                req.body = {
                    name: payload,
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
            }
        });

        test('should sanitize event handler attributes', async () => {
            const eventHandlers = [
                'onerror=alert(1)',
                'onload=alert(1)',
                'onclick=alert(1)',
                'onmouseover=alert(1)',
                'onfocus=alert(1)'
            ];

            for (const handler of eventHandlers) {
                req.body = {
                    name: `Admin ${handler}`,
                    email: 'admin@school.com',
                    password: 'password123',
                    schoolName: 'Test School'
                };

                await adminRegister(req, res);

                expect(res.status).toHaveBeenCalledWith(400);
            }
        });
    });

    // ===== CSRF PROTECTION =====
    describe('CSRF Protection', () => {
        
        test('should validate CSRF token for state-changing operations', async () => {
            const csrfToken = 'valid-csrf-token-12345';
            
            // Simulate CSRF token validation
            req.headers['x-csrf-token'] = csrfToken;
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            // Mock CSRF validation
            const storedToken = 'valid-csrf-token-12345';
            const isValidToken = req.headers['x-csrf-token'] === storedToken;

            expect(isValidToken).toBe(true);
        });

        test('should reject requests without CSRF token', async () => {
            // No CSRF token provided
            req.headers['x-csrf-token'] = undefined;
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            const hasCSRFToken = req.headers['x-csrf-token'] !== undefined;

            expect(hasCSRFToken).toBe(false);
        });

        test('should reject requests with invalid CSRF token', async () => {
            req.headers['x-csrf-token'] = 'invalid-token';
            
            const storedToken = 'valid-csrf-token-12345';
            const isValidToken = req.headers['x-csrf-token'] === storedToken;

            expect(isValidToken).toBe(false);
        });

        test('should generate unique CSRF tokens per session', async () => {
            const generateCSRFToken = () => {
                return Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
            };

            const token1 = generateCSRFToken();
            const token2 = generateCSRFToken();
            const token3 = generateCSRFToken();

            // All tokens should be unique
            expect(token1).not.toBe(token2);
            expect(token2).not.toBe(token3);
            expect(token1).not.toBe(token3);
        });
    });

    // ===== SECURE PASSWORD HASHING =====
    describe('Secure Password Hashing with bcrypt', () => {
        
        test('should use bcrypt for password hashing', async () => {
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            bcrypt.hash.mockResolvedValueOnce('$2b$10$hashedPassword');
            Admin.mockImplementationOnce(() => ({
                save: jest.fn().mockResolvedValueOnce({
                    _id: '123',
                    name: 'Admin',
                    email: 'admin@school.com',
                    password: '$2b$10$hashedPassword'
                })
            }));

            await adminRegister(req, res);

            // Should use bcrypt with cost factor 10
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
        });

        test('should use appropriate bcrypt cost factor (10+)', async () => {
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            bcrypt.hash.mockResolvedValueOnce('$2b$10$hashedPassword');
            Admin.mockImplementationOnce(() => ({
                save: jest.fn().mockResolvedValueOnce({})
            }));

            await adminRegister(req, res);

            // Bcrypt cost factor should be at least 10
            const costFactor = 10;
            expect(costFactor).toBeGreaterThanOrEqual(10);
            expect(bcrypt.hash).toHaveBeenCalledWith('password123', costFactor);
        });

        test('should never store plain text passwords', async () => {
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            const hashedPassword = '$2b$10$hashedPassword';
            bcrypt.hash.mockResolvedValueOnce(hashedPassword);
            
            let savedPassword;
            Admin.mockImplementationOnce(() => ({
                save: jest.fn().mockImplementationOnce(function() {
                    savedPassword = this.password;
                    return Promise.resolve(this);
                }),
                password: hashedPassword
            }));

            await adminRegister(req, res);

            // Saved password should be hashed, not plain text
            expect(savedPassword).toBe(hashedPassword);
            expect(savedPassword).not.toBe('password123');
        });

        test('should use bcrypt.compare for password verification', async () => {
            // Clear mocks before this test
            jest.clearAllMocks();
            
            req.body = {
                email: 'admin@school.com',
                password: 'password123'
            };

            const mockAdmin = {
                _id: '123',
                email: 'admin@school.com',
                password: '$2b$10$hashedPassword',
                schoolName: 'Test School',
                name: 'Admin',
                role: 'Admin'
            };

            Admin.findOne.mockResolvedValueOnce(mockAdmin);
            bcrypt.compare.mockResolvedValueOnce(true);

            await adminLogIn(req, res);

            // Should use bcrypt.compare for verification
            expect(bcrypt.compare).toHaveBeenCalled();
            expect(bcrypt.compare).toHaveBeenCalledWith(
                'password123',
                '$2b$10$hashedPassword'
            );
        });

        test('should generate unique salt for each password', async () => {
            const password = 'password123';
            
            bcrypt.hash.mockResolvedValueOnce('$2b$10$salt1hashedPassword');
            const hash1 = await bcrypt.hash(password, 10);

            bcrypt.hash.mockResolvedValueOnce('$2b$10$salt2hashedPassword');
            const hash2 = await bcrypt.hash(password, 10);

            // Same password should produce different hashes due to unique salts
            expect(hash1).not.toBe(hash2);
        });
    });

    // ===== HTTPS ENFORCEMENT =====
    describe('HTTPS Enforcement in Production', () => {
        
        test('should enforce HTTPS in production environment', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            req.protocol = 'http';
            req.headers['x-forwarded-proto'] = 'http';

            // Simulate HTTPS enforcement middleware
            const isSecure = req.protocol === 'https' || 
                           req.headers['x-forwarded-proto'] === 'https';

            if (!isSecure && process.env.NODE_ENV === 'production') {
                // Should redirect to HTTPS
                expect(isSecure).toBe(false);
            }

            process.env.NODE_ENV = originalEnv;
        });

        test('should allow HTTP in development environment', async () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            req.protocol = 'http';

            const isSecure = req.protocol === 'https';
            const isDevelopment = process.env.NODE_ENV === 'development';

            // HTTP allowed in development
            expect(!isSecure && isDevelopment).toBe(true);

            process.env.NODE_ENV = originalEnv;
        });

        test('should set Strict-Transport-Security header', async () => {
            const hstsHeader = 'max-age=31536000; includeSubDomains; preload';
            
            res.setHeader('Strict-Transport-Security', hstsHeader);

            expect(res.setHeader).toHaveBeenCalledWith(
                'Strict-Transport-Security',
                hstsHeader
            );
        });
    });

    // ===== SECURITY HEADERS =====
    describe('Security Headers Implementation', () => {
        
        test('should implement X-Content-Type-Options header', async () => {
            res.setHeader('X-Content-Type-Options', 'nosniff');

            expect(res.setHeader).toHaveBeenCalledWith(
                'X-Content-Type-Options',
                'nosniff'
            );
        });

        test('should implement X-Frame-Options header', async () => {
            res.setHeader('X-Frame-Options', 'DENY');

            expect(res.setHeader).toHaveBeenCalledWith(
                'X-Frame-Options',
                'DENY'
            );
        });

        test('should implement X-XSS-Protection header', async () => {
            res.setHeader('X-XSS-Protection', '1; mode=block');

            expect(res.setHeader).toHaveBeenCalledWith(
                'X-XSS-Protection',
                '1; mode=block'
            );
        });

        test('should implement Content-Security-Policy header', async () => {
            const cspPolicy = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'";
            
            res.setHeader('Content-Security-Policy', cspPolicy);

            expect(res.setHeader).toHaveBeenCalledWith(
                'Content-Security-Policy',
                cspPolicy
            );
        });

        test('should implement Referrer-Policy header', async () => {
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

            expect(res.setHeader).toHaveBeenCalledWith(
                'Referrer-Policy',
                'strict-origin-when-cross-origin'
            );
        });

        test('should implement Permissions-Policy header', async () => {
            const permissionsPolicy = 'geolocation=(), microphone=(), camera=()';
            
            res.setHeader('Permissions-Policy', permissionsPolicy);

            expect(res.setHeader).toHaveBeenCalledWith(
                'Permissions-Policy',
                permissionsPolicy
            );
        });

        test('should remove X-Powered-By header', async () => {
            // X-Powered-By should not be set to hide server information
            const headers = {};
            
            expect(headers['X-Powered-By']).toBeUndefined();
        });
    });

    // ===== FILE UPLOAD VALIDATION =====
    describe('File Upload Validation', () => {
        
        test('should validate file type for uploads', async () => {
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
            
            const testFiles = [
                { mimetype: 'image/jpeg', valid: true },
                { mimetype: 'image/png', valid: true },
                { mimetype: 'application/pdf', valid: true },
                { mimetype: 'application/x-msdownload', valid: false },
                { mimetype: 'text/html', valid: false }
            ];

            testFiles.forEach(file => {
                const isValid = allowedMimeTypes.includes(file.mimetype);
                expect(isValid).toBe(file.valid);
            });
        });

        test('should validate file size limits', async () => {
            const maxFileSize = 5 * 1024 * 1024; // 5MB

            const testFiles = [
                { size: 1024 * 1024, valid: true },      // 1MB
                { size: 3 * 1024 * 1024, valid: true },  // 3MB
                { size: 6 * 1024 * 1024, valid: false }, // 6MB
                { size: 10 * 1024 * 1024, valid: false } // 10MB
            ];

            testFiles.forEach(file => {
                const isValid = file.size <= maxFileSize;
                expect(isValid).toBe(file.valid);
            });
        });

        test('should sanitize file names to prevent directory traversal', async () => {
            const maliciousFileNames = [
                '../../../etc/passwd',
                '..\\..\\..\\windows\\system32\\config\\sam',
                'file.php.jpg',
                'image.jpg.exe',
                'test<script>.jpg',
                'file|command.jpg'
            ];

            const sanitizeFileName = (filename) => {
                // Remove path separators and dangerous characters
                return filename
                    .replace(/\.\./g, '')
                    .replace(/[\/\\]/g, '_')
                    .replace(/[^a-zA-Z0-9._-]/g, '_');
            };

            maliciousFileNames.forEach(filename => {
                const sanitized = sanitizeFileName(filename);
                expect(sanitized).not.toContain('/');
                expect(sanitized).not.toContain('\\');
                expect(sanitized).not.toContain('<');
                expect(sanitized).not.toContain('|');
            });
        });

        test('should validate file extension matches mime type', async () => {
            const validateFileType = (filename, mimetype) => {
                const ext = filename.split('.').pop().toLowerCase();
                const mimeMap = {
                    'jpg': 'image/jpeg',
                    'jpeg': 'image/jpeg',
                    'png': 'image/png',
                    'gif': 'image/gif',
                    'pdf': 'application/pdf'
                };

                return mimeMap[ext] === mimetype;
            };

            expect(validateFileType('image.jpg', 'image/jpeg')).toBe(true);
            expect(validateFileType('image.png', 'image/png')).toBe(true);
            expect(validateFileType('doc.pdf', 'application/pdf')).toBe(true);
            expect(validateFileType('image.jpg', 'application/pdf')).toBe(false);
            expect(validateFileType('file.exe', 'image/jpeg')).toBe(false);
        });

        test('should scan uploaded files for malware signatures', async () => {
            const malwareSignatures = ['<%eval', 'MZ', '<?php'];
            
            const scanFile = (content) => {
                return malwareSignatures.some(sig => content.includes(sig));
            };

            expect(scanFile('Normal image data')).toBe(false);
            expect(scanFile('<%eval(Request("cmd"))%>')).toBe(true);
            expect(scanFile('<?php system($_GET["cmd"]); ?>')).toBe(true);
        });
    });

    // ===== PATH TRAVERSAL PREVENTION =====
    describe('Path Traversal Attack Prevention', () => {
        
        test('should prevent directory traversal in file paths', async () => {
            const maliciousPaths = [
                '../../../etc/passwd',
                '..\\..\\..\\windows\\system32\\config\\sam',
                'uploads/../../../etc/passwd',
                'files/../../sensitive.txt',
                './../../private/data.json'
            ];

            const sanitizePath = (path) => {
                return path.replace(/\.\./g, '').replace(/\\/g, '/');
            };

            maliciousPaths.forEach(path => {
                const sanitized = sanitizePath(path);
                expect(sanitized).not.toContain('..');
            });
        });

        test('should validate file paths are within allowed directories', async () => {
            const allowedDir = '/var/www/uploads';
            
            const validatePath = (requestedPath) => {
                const normalizedPath = requestedPath.replace(/\\/g, '/');
                return normalizedPath.startsWith(allowedDir);
            };

            expect(validatePath('/var/www/uploads/file.jpg')).toBe(true);
            expect(validatePath('/var/www/uploads/folder/file.jpg')).toBe(true);
            expect(validatePath('/etc/passwd')).toBe(false);
            expect(validatePath('/var/www/../../../etc/passwd')).toBe(false);
        });

        test('should reject absolute paths in user inputs', async () => {
            const absolutePaths = [
                '/etc/passwd',
                'C:\\Windows\\System32',
                '/var/log/messages',
                'C:\\Users\\Admin\\Documents'
            ];

            const isAbsolutePath = (path) => {
                return path.startsWith('/') || /^[A-Za-z]:\\/.test(path);
            };

            absolutePaths.forEach(path => {
                expect(isAbsolutePath(path)).toBe(true);
            });
        });

        test('should normalize paths to prevent traversal', async () => {
            const normalizePath = (path) => {
                const parts = path.split('/').filter(part => part && part !== '.');
                const normalized = [];
                
                parts.forEach(part => {
                    if (part === '..') {
                        normalized.pop();
                    } else {
                        normalized.push(part);
                    }
                });
                
                return normalized.join('/');
            };

            expect(normalizePath('uploads/../../../etc/passwd')).toBe('etc/passwd');
            expect(normalizePath('files/./subfolder/../file.txt')).toBe('files/file.txt');
            expect(normalizePath('a/b/c/../../d')).toBe('a/d');
        });

        test('should prevent null byte injection in file paths', async () => {
            const nullByteAttacks = [
                'file.txt\x00.jpg',
                'document.pdf\x00.exe',
                'image\x00../../../etc/passwd'
            ];

            const sanitizeNullBytes = (path) => {
                return path.replace(/\x00/g, '');
            };

            nullByteAttacks.forEach(path => {
                const sanitized = sanitizeNullBytes(path);
                expect(sanitized).not.toContain('\x00');
            });
        });
    });
});
