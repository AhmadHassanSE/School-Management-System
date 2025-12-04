const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('../../models/adminSchema');
const { adminRegister } = require('../../controllers/admin-controller');

// Mock the Admin model
jest.mock('../../models/adminSchema');

// Mock bcrypt
jest.mock('bcrypt');

describe('Admin Registration Unit Tests', () => {
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

    // ==================== SUCCESSFUL REGISTRATION TESTS ====================

    it('should successfully register a new admin with valid data', async () => {
        req.body = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'SecurePass123',
            schoolName: 'Test School'
        };

        const hashedPassword = 'hashedPassword123';
        const mockAdminInstance = {
            _id: new mongoose.Types.ObjectId(),
            name: 'John Doe',
            email: 'john@example.com',
            password: hashedPassword,
            role: 'Admin',
            schoolName: 'Test School',
            save: jest.fn().mockResolvedValue(true)
        };

        bcrypt.hash.mockResolvedValue(hashedPassword);
        Admin.findOne.mockResolvedValue(null);
        Admin.mockImplementation(() => mockAdminInstance);

        await adminRegister(req, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123', 10);
        expect(Admin.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
        expect(mockAdminInstance.save).toHaveBeenCalled();
        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            name: 'John Doe',
            email: 'john@example.com',
            role: 'Admin'
        }));
    });

    it('should hash password before saving', async () => {
        req.body = {
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'MyPassword456',
            schoolName: 'Jane School'
        };

        const hashedPassword = 'hashedPassword456';
        const mockAdminInstance = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: hashedPassword,
            role: 'Admin',
            schoolName: 'Jane School',
            save: jest.fn().mockResolvedValue(true)
        };

        bcrypt.hash.mockResolvedValue(hashedPassword);
        Admin.findOne.mockResolvedValue(null);
        Admin.mockImplementation(() => mockAdminInstance);

        await adminRegister(req, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('MyPassword456', 10);
        expect(mockAdminInstance.password).toBe(hashedPassword);
    });

    it('should create school name from admin details', async () => {
        req.body = {
            name: 'Admin User',
            email: 'admin@school.com',
            password: 'AdminPass789',
            schoolName: 'Primary School'
        };

        const hashedPassword = 'hashedPasswordSchool';
        const mockAdminInstance = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Admin User',
            email: 'admin@school.com',
            password: hashedPassword,
            role: 'Admin',
            schoolName: 'Primary School',
            save: jest.fn().mockResolvedValue(true)
        };

        bcrypt.hash.mockResolvedValue(hashedPassword);
        Admin.findOne.mockResolvedValue(null);
        Admin.mockImplementation(() => mockAdminInstance);

        await adminRegister(req, res);

        expect(res.send).toHaveBeenCalledWith(expect.objectContaining({
            schoolName: 'Primary School'
        }));
    });

    it('should return admin object without password on successful registration', async () => {
        req.body = {
            name: 'Test Admin',
            email: 'test@admin.com',
            password: 'TestPass123',
            schoolName: 'Test School'
        };

        const hashedPassword = 'hashedTestPass';
        const mockAdminInstance = {
            _id: new mongoose.Types.ObjectId(),
            name: 'Test Admin',
            email: 'test@admin.com',
            password: hashedPassword,
            role: 'Admin',
            schoolName: 'Test School',
            save: jest.fn().mockResolvedValue(true)
        };

        bcrypt.hash.mockResolvedValue(hashedPassword);
        Admin.findOne.mockResolvedValue(null);
        Admin.mockImplementation(() => mockAdminInstance);

        await adminRegister(req, res);

        expect(res.send).toHaveBeenCalled();
        const responseData = res.send.mock.calls[0][0];
        expect(responseData).not.toHaveProperty('password');
    });

    // ==================== VALIDATION TESTS ====================

    it('should reject registration with missing name', async () => {
        req.body = {
            email: 'test@example.com',
            password: 'Password123',
            schoolName: 'Test School'
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/name|required/i)
            })
        );
    });

    it('should reject registration with missing email', async () => {
        req.body = {
            name: 'John Doe',
            password: 'Password123',
            schoolName: 'Test School'
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/email|required/i)
            })
        );
    });

    it('should reject registration with missing password', async () => {
        req.body = {
            name: 'John Doe',
            email: 'john@example.com',
            schoolName: 'Test School'
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/password|required/i)
            })
        );
    });

    it('should reject registration with invalid email format', async () => {
        req.body = {
            name: 'John Doe',
            email: 'invalid-email',
            password: 'Password123',
            schoolName: 'Test School'
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/email|invalid|format/i)
            })
        );
    });

    it('should reject registration with duplicate email', async () => {
        req.body = {
            name: 'John Doe',
            email: 'existing@example.com',
            password: 'Password123',
            schoolName: 'Test School'
        };

        const existingAdmin = {
            _id: new mongoose.Types.ObjectId(),
            email: 'existing@example.com',
            name: 'Existing Admin'
        };

        Admin.findOne.mockResolvedValue(existingAdmin);

        await adminRegister(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({ email: 'existing@example.com' });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/email|already|exists/i)
            })
        );
    });

    it('should reject registration with weak password', async () => {
        req.body = {
            name: 'John Doe',
            email: 'john@example.com',
            password: '123',
            schoolName: 'Test School'
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/password|6|characters|long/i)
            })
        );
    });

    it('should reject registration with empty name', async () => {
        req.body = {
            name: '',
            email: 'john@example.com',
            password: 'Password123',
            schoolName: 'Test School'
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/name|required/i)
            })
        );
    });

    it('should reject registration with empty email', async () => {
        req.body = {
            name: 'John Doe',
            email: '',
            password: 'Password123',
            schoolName: 'Test School'
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/email|required/i)
            })
        );
    });

    it('should reject registration with empty password', async () => {
        req.body = {
            name: 'John Doe',
            email: 'john@example.com',
            password: '',
            schoolName: 'Test School'
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/password|required/i)
            })
        );
    });

    // ==================== DATABASE ERROR TESTS ====================

    it('should handle database errors during registration', async () => {
        req.body = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Password123',
            schoolName: 'Test School'
        };

        const dbError = new Error('Database connection error');
        Admin.findOne.mockRejectedValue(dbError);

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.any(String)
            })
        );
    });

    it('should handle save errors during registration', async () => {
        req.body = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Password123',
            schoolName: 'Test School'
        };

        const hashedPassword = 'hashedPassword';
        const mockAdminInstance = {
            _id: new mongoose.Types.ObjectId(),
            name: 'John Doe',
            email: 'john@example.com',
            password: hashedPassword,
            role: 'Admin',
            schoolName: 'Test School',
            save: jest.fn().mockRejectedValue(new Error('Save failed'))
        };

        bcrypt.hash.mockResolvedValue(hashedPassword);
        Admin.findOne.mockResolvedValue(null);
        Admin.mockImplementation(() => mockAdminInstance);

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.any(String)
            })
        );
    });

    // ==================== INPUT SANITIZATION TESTS ====================

    it('should sanitize input data before saving', async () => {
        req.body = {
            name: '  John Doe  ',
            email: '  JOHN@EXAMPLE.COM  ',
            password: 'Password123',
            schoolName: '  Test School  '
        };

        const hashedPassword = 'hashedPassword';
        const mockAdminInstance = {
            _id: new mongoose.Types.ObjectId(),
            name: 'John Doe',
            email: 'john@example.com',
            password: hashedPassword,
            role: 'Admin',
            schoolName: 'Test School',
            save: jest.fn().mockResolvedValue(true)
        };

        bcrypt.hash.mockResolvedValue(hashedPassword);
        Admin.findOne.mockResolvedValue(null);
        Admin.mockImplementation(() => mockAdminInstance);

        await adminRegister(req, res);

        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'John Doe',
                email: 'john@example.com',
                schoolName: 'Test School'
            })
        );
    });

    it('should convert email to lowercase before saving', async () => {
        req.body = {
            name: 'John Doe',
            email: 'JOHN@EXAMPLE.COM',
            password: 'Password123',
            schoolName: 'Test School'
        };

        const hashedPassword = 'hashedPassword';
        const mockAdminInstance = {
            _id: new mongoose.Types.ObjectId(),
            name: 'John Doe',
            email: 'john@example.com',
            role: 'Admin',
            schoolName: 'Test School',
            save: jest.fn().mockResolvedValue(true)
        };

        bcrypt.hash.mockResolvedValue(hashedPassword);
        Admin.findOne.mockResolvedValue(null);
        Admin.mockImplementation(() => mockAdminInstance);

        await adminRegister(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
    });

    it('should handle special characters in name', async () => {
        req.body = {
            name: 'John O\'Brien',
            email: 'john@example.com',
            password: 'Password123',
            schoolName: 'Test School'
        };

        const hashedPassword = 'hashedPassword';
        const mockAdminInstance = {
            _id: new mongoose.Types.ObjectId(),
            name: 'John O\'Brien',
            email: 'john@example.com',
            password: hashedPassword,
            role: 'Admin',
            schoolName: 'Test School',
            save: jest.fn().mockResolvedValue(true)
        };

        bcrypt.hash.mockResolvedValue(hashedPassword);
        Admin.findOne.mockResolvedValue(null);
        Admin.mockImplementation(() => mockAdminInstance);

        await adminRegister(req, res);

        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'John O\'Brien'
            })
        );
    });

    // ==================== SECURITY TESTS ====================

    it('should prevent XSS attacks in name field', async () => {
        req.body = {
            name: '<script>alert("xss")</script>',
            email: 'john@example.com',
            password: 'Password123',
            schoolName: 'Test School'
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should prevent SQL injection in email field', async () => {
        req.body = {
            name: 'John Doe',
            email: "admin' OR '1'='1",
            password: 'Password123',
            schoolName: 'Test School'
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/email|invalid/i)
            })
        );
    });

    it('should validate password contains minimum characters', async () => {
        req.body = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Pass1',
            schoolName: 'Test School'
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/password|6|characters|long/i)
            })
        );
    });

    // ==================== EDGE CASES ====================

    it('should handle missing schoolName field', async () => {
        req.body = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Password123'
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/school|required/i)
            })
        );
    });

    it('should handle null values in request body', async () => {
        req.body = {
            name: null,
            email: null,
            password: null,
            schoolName: null
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should handle undefined values in request body', async () => {
        req.body = {
            name: undefined,
            email: undefined,
            password: undefined,
            schoolName: undefined
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject extremely long name', async () => {
        req.body = {
            name: 'a'.repeat(1000),
            email: 'john@example.com',
            password: 'Password123',
            schoolName: 'Test School'
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/name|long/i)
            })
        );
    });

    it('should reject extremely long email', async () => {
        req.body = {
            name: 'John Doe',
            email: 'a'.repeat(300) + '@example.com',
            password: 'Password123',
            schoolName: 'Test School'
        };

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/email|long/i)
            })
        );
    });

    // ==================== BCRYPT TESTS ====================

    it('should use bcrypt with salt rounds of 10', async () => {
        req.body = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Password123',
            schoolName: 'Test School'
        };

        const hashedPassword = 'hashedPassword';
        const mockAdminInstance = {
            _id: new mongoose.Types.ObjectId(),
            name: 'John Doe',
            email: 'john@example.com',
            password: hashedPassword,
            role: 'Admin',
            schoolName: 'Test School',
            save: jest.fn().mockResolvedValue(true)
        };

        bcrypt.hash.mockResolvedValue(hashedPassword);
        Admin.findOne.mockResolvedValue(null);
        Admin.mockImplementation(() => mockAdminInstance);

        await adminRegister(req, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
    });

    it('should handle bcrypt hashing errors', async () => {
        req.body = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Password123',
            schoolName: 'Test School'
        };

        bcrypt.hash.mockRejectedValue(new Error('Hashing failed'));
        Admin.findOne.mockResolvedValue(null);

        await adminRegister(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.any(String)
            })
        );
    });

    // ==================== ROLE ASSIGNMENT TESTS ====================

    it('should automatically assign Admin role', async () => {
        req.body = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Password123',
            schoolName: 'Test School'
        };

        const hashedPassword = 'hashedPassword';
        const mockAdminInstance = {
            _id: new mongoose.Types.ObjectId(),
            name: 'John Doe',
            email: 'john@example.com',
            password: hashedPassword,
            role: 'Admin',
            schoolName: 'Test School',
            save: jest.fn().mockResolvedValue(true)
        };

        bcrypt.hash.mockResolvedValue(hashedPassword);
        Admin.findOne.mockResolvedValue(null);
        Admin.mockImplementation(() => mockAdminInstance);

        await adminRegister(req, res);

        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                role: 'Admin'
            })
        );
    });

    it('should not allow user to override admin role', async () => {
        req.body = {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'Password123',
            schoolName: 'Test School',
            role: 'SuperAdmin'
        };

        const hashedPassword = 'hashedPassword';
        const mockAdminInstance = {
            _id: new mongoose.Types.ObjectId(),
            name: 'John Doe',
            email: 'john@example.com',
            password: hashedPassword,
            role: 'Admin',
            schoolName: 'Test School',
            save: jest.fn().mockResolvedValue(true)
        };

        bcrypt.hash.mockResolvedValue(hashedPassword);
        Admin.findOne.mockResolvedValue(null);
        Admin.mockImplementation(() => mockAdminInstance);

        await adminRegister(req, res);

        expect(res.send).toHaveBeenCalledWith(
            expect.objectContaining({
                role: 'Admin'
            })
        );
    });
});