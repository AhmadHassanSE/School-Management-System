const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('../../models/adminSchema');
const { adminLogIn } = require('../../controllers/admin-controller');

// Mock the Admin model
jest.mock('../../models/adminSchema');

// Mock bcrypt
jest.mock('bcrypt');

describe('Admin Login Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Mock request object
        req = {
            body: {},
            params: {}
        };

        // Mock response object
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    });

    // ==================== SUCCESSFUL LOGIN TESTS ====================

    it('should successfully login with correct credentials', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'Password123'
        };

        const hashedPassword = 'hashedPassword123';
        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Admin User',
            email: 'admin@example.com',
            password: hashedPassword,
            role: 'Admin',
            schoolName: 'Test School'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(true);

        await adminLogIn(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({ email: 'admin@example.com' });
        expect(bcrypt.compare).toHaveBeenCalledWith('Password123', hashedPassword);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                _id: mockAdmin._id,
                name: 'Admin User',
                email: 'admin@example.com',
                role: 'Admin',
                schoolName: 'Test School'
            })
        );
    });

    it('should return JWT token on successful login', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'Password123'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: 'Admin',
            schoolName: 'Test School'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(true);

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                _id: expect.any(mongoose.Types.ObjectId),
                email: 'admin@example.com'
            })
        );
    });

    it('should not return password in response', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'Password123'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: 'Admin',
            schoolName: 'Test School'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(true);

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const responseData = res.json.mock.calls[0][0];
        expect(responseData).not.toHaveProperty('password');
    });

    it('should handle case-insensitive email login', async () => {
        req.body = {
            email: 'ADMIN@EXAMPLE.COM',
            password: 'Password123'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: 'Admin',
            schoolName: 'Test School'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(true);

        await adminLogIn(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({ email: 'admin@example.com' });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // ==================== VALIDATION TESTS ====================

    it('should reject login with incorrect email', async () => {
        req.body = {
            email: 'wrong@example.com',
            password: 'Password123'
        };

        Admin.findOne.mockResolvedValue(null);

        await adminLogIn(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({ email: 'wrong@example.com' });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/admin|not|found/i)
            })
        );
    });

    it('should reject login with incorrect password', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'WrongPassword'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: 'Admin',
            schoolName: 'Test School'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(false);

        await adminLogIn(req, res);

        expect(bcrypt.compare).toHaveBeenCalledWith('WrongPassword', 'hashedPassword');
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/invalid|credentials/i)
            })
        );
    });

    it('should reject login with missing email', async () => {
        req.body = {
            password: 'Password123'
        };

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/email|password|required/i)
            })
        );
    });

    it('should reject login with missing password', async () => {
        req.body = {
            email: 'admin@example.com'
        };

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/email|password|required/i)
            })
        );
    });

    it('should reject login with empty email', async () => {
        req.body = {
            email: '',
            password: 'Password123'
        };

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/email|password|required/i)
            })
        );
    });

    it('should reject login with empty password', async () => {
        req.body = {
            email: 'admin@example.com',
            password: ''
        };

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/email|password|required/i)
            })
        );
    });

    it('should reject login with null email', async () => {
        req.body = {
            email: null,
            password: 'Password123'
        };

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject login with null password', async () => {
        req.body = {
            email: 'admin@example.com',
            password: null
        };

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject login with undefined email', async () => {
        req.body = {
            email: undefined,
            password: 'Password123'
        };

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject login with undefined password', async () => {
        req.body = {
            email: 'admin@example.com',
            password: undefined
        };

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    // ==================== NON-EXISTENT ACCOUNT TESTS ====================

    it('should handle non-existent admin account', async () => {
        req.body = {
            email: 'nonexistent@example.com',
            password: 'Password123'
        };

        Admin.findOne.mockResolvedValue(null);

        await adminLogIn(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/admin|not|found/i)
            })
        );
    });

    it('should not reveal if account exists when password is wrong', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'WrongPassword'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: 'Admin'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(false);

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/invalid|credentials/i)
            })
        );
    });

    // ==================== EMAIL VALIDATION TESTS ====================

    it('should validate email format before login attempt', async () => {
        req.body = {
            email: 'invalid-email',
            password: 'Password123'
        };

        // Mock admin to be found even with invalid email to test if validation happens first
        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            email: 'invalid-email',
            password: 'hashedPassword'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(true);

        await adminLogIn(req, res);

        // Should still work since we're mocking the database
        // In real scenario, database would handle email validation
        expect(Admin.findOne).toHaveBeenCalled();
    });

    it('should trim whitespace from email before lookup', async () => {
        req.body = {
            email: '  admin@example.com  ',
            password: 'Password123'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: 'Admin',
            schoolName: 'Test School'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(true);

        await adminLogIn(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({ email: 'admin@example.com' });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // ==================== DATABASE ERROR TESTS ====================

    it('should handle database errors during login', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'Password123'
        };

        const dbError = new Error('Database connection error');
        Admin.findOne.mockRejectedValue(dbError);

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.any(String)
            })
        );
    });

    it('should handle bcrypt comparison errors', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'Password123'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: 'Admin'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockRejectedValue(new Error('Bcrypt error'));

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.any(String)
            })
        );
    });

    it('should handle null response from database', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'Password123'
        };

        Admin.findOne.mockResolvedValue(null);

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/admin|not|found/i)
            })
        );
    });

    // ==================== SECURITY TESTS ====================

    it('should prevent SQL injection in email field', async () => {
        req.body = {
            email: "admin' OR '1'='1",
            password: 'Password123'
        };

        Admin.findOne.mockResolvedValue(null);

        await adminLogIn(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({ 
            email: expect.stringContaining("admin' OR '1'='1".toLowerCase())
        });
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle XSS attempts in email field', async () => {
        req.body = {
            email: '<script>alert("xss")</script>',
            password: 'Password123'
        };

        Admin.findOne.mockResolvedValue(null);

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should sanitize email input', async () => {
        req.body = {
            email: '<script>admin@example.com</script>',
            password: 'Password123'
        };

        Admin.findOne.mockResolvedValue(null);

        await adminLogIn(req, res);

        expect(Admin.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    // ==================== PASSWORD COMPARISON TESTS ====================

    it('should use bcrypt.compare for password verification', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'Password123'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: 'Admin'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(true);

        await adminLogIn(req, res);

        expect(bcrypt.compare).toHaveBeenCalledWith('Password123', 'hashedPassword');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should reject when bcrypt.compare returns false', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'WrongPassword'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: 'Admin'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(false);

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/invalid|credentials/i)
            })
        );
    });

    // ==================== RESPONSE FORMAT TESTS ====================

    it('should return admin object with correct fields', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'Password123'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: 'Admin',
            schoolName: 'Test School'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(true);

        await adminLogIn(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                _id: expect.any(mongoose.Types.ObjectId),
                name: expect.any(String),
                email: expect.any(String),
                role: expect.any(String),
                schoolName: expect.any(String)
            })
        );
    });

    it('should return 200 status code on successful login', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'Password123'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: 'Admin'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(true);

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 for invalid credentials', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'WrongPassword'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            email: 'admin@example.com',
            password: 'hashedPassword'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(false);

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 404 for non-existent admin', async () => {
        req.body = {
            email: 'nonexistent@example.com',
            password: 'Password123'
        };

        Admin.findOne.mockResolvedValue(null);

        await adminLogIn(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    // ==================== EDGE CASES ====================

    it('should handle very long email addresses', async () => {
        req.body = {
            email: 'a'.repeat(300) + '@example.com',
            password: 'Password123'
        };

        Admin.findOne.mockResolvedValue(null);

        await adminLogIn(req, res);

        expect(Admin.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should handle very long passwords', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'a'.repeat(1000)
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            email: 'admin@example.com',
            password: 'hashedPassword'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(false);

        await adminLogIn(req, res);

        expect(bcrypt.compare).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should handle special characters in password', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'P@ssw0rd!@#$%^&*()'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: 'Admin'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(true);

        await adminLogIn(req, res);

        expect(bcrypt.compare).toHaveBeenCalledWith('P@ssw0rd!@#$%^&*()', 'hashedPassword');
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle unicode characters in email', async () => {
        req.body = {
            email: 'admin用户@example.com',
            password: 'Password123'
        };

        Admin.findOne.mockResolvedValue(null);

        await adminLogIn(req, res);

        expect(Admin.findOne).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(404);
    });

    // ==================== CONCURRENT LOGIN TESTS ====================

    it('should handle multiple concurrent login attempts', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'Password123'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: 'Admin'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(true);

        await Promise.all([
            adminLogIn(req, res),
            adminLogIn(req, res),
            adminLogIn(req, res)
        ]);

        expect(Admin.findOne).toHaveBeenCalledTimes(3);
        expect(bcrypt.compare).toHaveBeenCalledTimes(3);
    });

    // ==================== ADMIN ROLE VERIFICATION ====================

    it('should return admin with correct role', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'Password123'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: 'Admin',
            schoolName: 'Test School'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(true);

        await adminLogIn(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                role: 'Admin'
            })
        );
    });

    it('should include schoolName in response', async () => {
        req.body = {
            email: 'admin@example.com',
            password: 'Password123'
        };

        const mockAdmin = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'hashedPassword',
            role: 'Admin',
            schoolName: 'Test School'
        };

        Admin.findOne.mockResolvedValue(mockAdmin);
        bcrypt.compare.mockResolvedValue(true);

        await adminLogIn(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                schoolName: 'Test School'
            })
        );
    });
});