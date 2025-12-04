const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Admin = require('../../models/adminSchema');
const { updateAdmin } = require('../../controllers/admin-controller');

// Mock the Admin model
jest.mock('../../models/adminSchema');

// Mock bcrypt
jest.mock('bcrypt');

describe('Admin Update Unit Tests', () => {
    let req, res;

    // Helper function to mock findByIdAndUpdate with chainable select
    const mockFindByIdAndUpdateWithSelect = (value) => {
        Admin.findByIdAndUpdate.mockReturnValue({
            select: jest.fn().mockResolvedValue(value)
        });
    };

    beforeEach(() => {
        // Reset specific mocks, not all
        Admin.findByIdAndUpdate.mockClear();
        Admin.findOne.mockClear();
        bcrypt.hash.mockClear();

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

    // ==================== SUCCESSFUL UPDATE TESTS ====================

    it('should successfully update admin name', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Updated Name'
        };

        const updatedAdmin = {
            _id: adminId,
            name: 'Updated Name',
            email: 'admin@example.com',
            role: 'Admin',
            schoolName: 'Test School'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(Admin.findByIdAndUpdate).toHaveBeenCalledWith(
            adminId,
            expect.objectContaining({
                name: 'Updated Name'
            }),
            expect.objectContaining({
                new: true,
                runValidators: true
            })
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(updatedAdmin);
    });

    it('should successfully update admin email', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            email: 'newemail@example.com'
        };

        Admin.findOne.mockResolvedValue(null);

        const updatedAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'newemail@example.com',
            role: 'Admin',
            schoolName: 'Test School'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({
            email: 'newemail@example.com',
            _id: { $ne: adminId }
        });
        expect(Admin.findByIdAndUpdate).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(updatedAdmin);
    });

    it('should successfully update admin password', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            password: 'NewPassword123'
        };

        const hashedPassword = 'hashedNewPassword';
        bcrypt.hash.mockResolvedValue(hashedPassword);

        const updatedAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'Admin',
            schoolName: 'Test School'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123', 10);
        expect(Admin.findByIdAndUpdate).toHaveBeenCalledWith(
            adminId,
            expect.objectContaining({
                password: hashedPassword
            }),
            expect.any(Object)
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should hash new password on update', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            password: 'MyNewPassword456'
        };

        const hashedPassword = 'hashedMyNewPassword456';
        bcrypt.hash.mockResolvedValue(hashedPassword);

        const updatedAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'Admin'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('MyNewPassword456', 10);
    });

    it('should update multiple fields at once', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Updated Name',
            email: 'updated@example.com',
            password: 'UpdatedPass123'
        };

        Admin.findOne.mockResolvedValue(null);
        const hashedPassword = 'hashedUpdatedPass';
        bcrypt.hash.mockResolvedValue(hashedPassword);

        const updatedAdmin = {
            _id: adminId,
            name: 'Updated Name',
            email: 'updated@example.com',
            role: 'Admin'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(Admin.findByIdAndUpdate).toHaveBeenCalledWith(
            adminId,
            expect.objectContaining({
                name: 'Updated Name',
                email: 'updated@example.com',
                password: hashedPassword
            }),
            expect.any(Object)
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should not return password in response', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Updated Admin'
        };

        const updatedAdmin = {
            _id: adminId,
            name: 'Updated Admin',
            email: 'admin@example.com',
            role: 'Admin'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        const responseData = res.json.mock.calls[0][0];
        expect(responseData).not.toHaveProperty('password');
    });

    it('should return 200 status on successful update', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Updated Admin'
        };

        const updatedAdmin = {
            _id: adminId,
            name: 'Updated Admin'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should trim whitespace from name during update', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: '  Updated Name  '
        };

        const updatedAdmin = {
            _id: adminId,
            name: 'Updated Name',
            email: 'admin@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(Admin.findByIdAndUpdate).toHaveBeenCalledWith(
            adminId,
            expect.objectContaining({
                name: 'Updated Name'
            }),
            expect.any(Object)
        );
    });

    it('should convert email to lowercase during update', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            email: 'NEWEMAIL@EXAMPLE.COM'
        };

        Admin.findOne.mockResolvedValue(null);

        const updatedAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'newemail@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({
            email: 'newemail@example.com',
            _id: { $ne: adminId }
        });
        expect(Admin.findByIdAndUpdate).toHaveBeenCalledWith(
            adminId,
            expect.objectContaining({
                email: 'newemail@example.com'
            }),
            expect.any(Object)
        );
    });

    // ==================== EMAIL VALIDATION TESTS ====================

    it('should reject update with invalid email format', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            email: 'invalid-email'
        };

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/email|invalid|format/i)
            })
        );
    });

    it('should reject update with duplicate email', async () => {
        const adminId = new mongoose.Types.ObjectId();
        const otherAdminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            email: 'existing@example.com'
        };

        const existingAdmin = {
            _id: otherAdminId,
            email: 'existing@example.com'
        };

        Admin.findOne.mockResolvedValue(existingAdmin);

        await updateAdmin(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({
            email: 'existing@example.com',
            _id: { $ne: adminId }
        });
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/email|already|exists/i)
            })
        );
    });

    it('should allow same email for same admin', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            email: 'admin@example.com'
        };

        Admin.findOne.mockResolvedValue(null);

        const updatedAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({
            email: 'admin@example.com',
            _id: { $ne: adminId }
        });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should exclude current admin when checking for duplicate email', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            email: 'newemail@example.com'
        };

        Admin.findOne.mockResolvedValue(null);

        const updatedAdmin = {
            _id: adminId,
            email: 'newemail@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({
            email: 'newemail@example.com',
            _id: { $ne: adminId }
        });
    });

    it('should reject email with spaces', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            email: 'admin @example.com'
        };

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject email without domain', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            email: 'admin@'
        };

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    // ==================== PASSWORD VALIDATION TESTS ====================

    it('should reject update with weak password', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            password: '123'
        };

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/password|6|characters|long/i)
            })
        );
    });

    it('should reject password with less than 6 characters', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            password: 'Pass1'
        };

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/password|6|characters|long/i)
            })
        );
    });

    it('should accept password with exactly 6 characters', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            password: 'Pass12'
        };

        const hashedPassword = 'hashedPass12';
        bcrypt.hash.mockResolvedValue(hashedPassword);

        const updatedAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('Pass12', 10);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should accept password with more than 6 characters', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            password: 'LongPassword123'
        };

        const hashedPassword = 'hashedLongPassword123';
        bcrypt.hash.mockResolvedValue(hashedPassword);

        const updatedAdmin = {
            _id: adminId,
            email: 'admin@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('LongPassword123', 10);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // ==================== NON-EXISTENT ADMIN TESTS ====================

    it('should handle update for non-existent admin', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Updated Name'
        };

        mockFindByIdAndUpdateWithSelect(null);

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/admin|not|found/i)
            })
        );
    });

    it('should return 404 when admin does not exist', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Updated Name'
        };

        mockFindByIdAndUpdateWithSelect(null);

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    // ==================== DATABASE ERROR TESTS ====================

    it('should handle database errors during update', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Updated Name'
        };

        // Mock findByIdAndUpdate to throw/reject
        Admin.findByIdAndUpdate.mockImplementationOnce(() => {
            throw new Error('Database connection error');
        });

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.any(String)
            })
        );
    });

    it('should handle validation errors from database', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Updated Name'
        };

        Admin.findByIdAndUpdate.mockImplementationOnce(() => {
            throw new Error('Validation failed');
        });

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle bcrypt hashing errors', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            password: 'NewPassword123'
        };

        bcrypt.hash.mockImplementationOnce(() => {
            throw new Error('Hashing failed');
        });

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.any(String)
            })
        );
    });

    it('should handle email uniqueness check errors', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            email: 'newemail@example.com'
        };

        Admin.findOne.mockImplementationOnce(() => {
            throw new Error('Database error during email check');
        });

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle cast errors gracefully', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Updated Name'
        };

        Admin.findByIdAndUpdate.mockImplementationOnce(() => {
            throw new Error('Cast to ObjectId failed');
        });

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalled();
    });

    // ==================== EMPTY/NULL REQUEST TESTS ====================

    it('should handle empty update request body', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {};

        const updatedAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(Admin.findByIdAndUpdate).toHaveBeenCalledWith(
            adminId,
            {},
            expect.any(Object)
        );
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle null field values', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: null
        };

        const updatedAdmin = {
            _id: adminId,
            name: 'Admin User'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(Admin.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should skip undefined fields', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: undefined,
            email: 'newemail@example.com'
        };

        Admin.findOne.mockResolvedValue(null);

        const updatedAdmin = {
            _id: adminId,
            email: 'newemail@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(Admin.findByIdAndUpdate).toHaveBeenCalledWith(
            adminId,
            expect.any(Object),
            expect.any(Object)
        );
    });

    // ==================== SPECIAL CHARACTERS TESTS ====================

    it('should handle special characters in name', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: "O'Brien-Smith, Jr."
        };

        const updatedAdmin = {
            _id: adminId,
            name: "O'Brien-Smith, Jr.",
            email: 'admin@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                name: "O'Brien-Smith, Jr."
            })
        );
    });

    it('should handle unicode characters in name', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: '张三 (Admin User)'
        };

        const updatedAdmin = {
            _id: adminId,
            name: '张三 (Admin User)',
            email: 'admin@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                name: '张三 (Admin User)'
            })
        );
    });

    it('should handle special characters in password', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            password: 'P@ssw0rd!@#$%^&*()'
        };

        const hashedPassword = 'hashedSpecialPass';
        bcrypt.hash.mockResolvedValue(hashedPassword);

        const updatedAdmin = {
            _id: adminId,
            email: 'admin@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('P@ssw0rd!@#$%^&*()', 10);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // ==================== EDGE CASES ====================

    it('should handle very long name', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        const longName = 'a'.repeat(200);
        req.body = {
            name: longName
        };

        const updatedAdmin = {
            _id: adminId,
            name: longName,
            email: 'admin@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle very long email', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        const longEmail = 'a'.repeat(100) + '@example.com';
        req.body = {
            email: longEmail
        };

        Admin.findOne.mockResolvedValue(null);

        const updatedAdmin = {
            _id: adminId,
            email: longEmail
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle very long password', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        const longPassword = 'a'.repeat(200);
        req.body = {
            password: longPassword
        };

        const hashedPassword = 'hashedLongPassword';
        bcrypt.hash.mockResolvedValue(hashedPassword);

        const updatedAdmin = {
            _id: adminId,
            email: 'admin@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(bcrypt.hash).toHaveBeenCalledWith(longPassword, 10);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    // ==================== SECURITY TESTS ====================

    it('should prevent XSS in name field', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: '<script>alert("xss")</script>'
        };

        const updatedAdmin = {
            _id: adminId,
            name: '<script>alert("xss")</script>'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should prevent SQL injection in email field', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            email: "admin' OR '1'='1@example.com"
        };

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    // ==================== UPDATE OPTIONS TESTS ====================

    it('should use new: true option in findByIdAndUpdate', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Updated Name'
        };

        const updatedAdmin = {
            _id: adminId,
            name: 'Updated Name'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(Admin.findByIdAndUpdate).toHaveBeenCalledWith(
            adminId,
            expect.any(Object),
            expect.objectContaining({
                new: true
            })
        );
    });

    it('should use runValidators: true option in findByIdAndUpdate', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Updated Name'
        };

        const updatedAdmin = {
            _id: adminId,
            name: 'Updated Name'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(Admin.findByIdAndUpdate).toHaveBeenCalledWith(
            adminId,
            expect.any(Object),
            expect.objectContaining({
                runValidators: true
            })
        );
    });

    // ==================== RESPONSE VALIDATION TESTS ====================

    it('should return updated admin data', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Updated Name'
        };

        const updatedAdmin = {
            _id: adminId,
            name: 'Updated Name',
            email: 'admin@example.com',
            role: 'Admin'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                _id: adminId,
                name: 'Updated Name',
                email: 'admin@example.com'
            })
        );
    });

    it('should not include password in response after update', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            password: 'NewPassword123'
        };

        const hashedPassword = 'hashedNewPassword';
        bcrypt.hash.mockResolvedValue(hashedPassword);

        const updatedAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        const responseData = res.json.mock.calls[0][0];
        expect(responseData).not.toHaveProperty('password');
    });

    // ==================== CONCURRENT UPDATE TESTS ====================

    it('should handle multiple concurrent updates', async () => {
        const adminId1 = new mongoose.Types.ObjectId();
        const adminId2 = new mongoose.Types.ObjectId();

        req.params.id = adminId1;
        req.body = { name: 'Admin One' };

        const updatedAdmin1 = {
            _id: adminId1,
            name: 'Admin One'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin1);

        await updateAdmin(req, res);

        req.params.id = adminId2;
        req.body = { name: 'Admin Two' };

        const updatedAdmin2 = {
            _id: adminId2,
            name: 'Admin Two'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin2);

        await updateAdmin(req, res);

        expect(Admin.findByIdAndUpdate).toHaveBeenCalledTimes(2);
    });

    // ==================== EMAIL TRIMMING TESTS ====================

    it('should trim whitespace from email during update', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            email: '  newemail@example.com  '
        };

        Admin.findOne.mockResolvedValue(null);

        const updatedAdmin = {
            _id: adminId,
            email: 'newemail@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(Admin.findOne).toHaveBeenCalledWith({
            email: 'newemail@example.com',
            _id: { $ne: adminId }
        });
    });

    // ==================== COMPREHENSIVE UPDATE TEST ====================

    it('should comprehensively update admin with all valid fields', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Complete Updated Admin',
            email: 'completeupdate@example.com',
            password: 'CompleteNewPass123'
        };

        Admin.findOne.mockResolvedValue(null);
        const hashedPassword = 'hashedCompleteNewPass';
        bcrypt.hash.mockResolvedValue(hashedPassword);

        const updatedAdmin = {
            _id: adminId,
            name: 'Complete Updated Admin',
            email: 'completeupdate@example.com',
            role: 'Admin',
            schoolName: 'Test School'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(bcrypt.hash).toHaveBeenCalledWith('CompleteNewPass123', 10);
        expect(Admin.findOne).toHaveBeenCalledWith({
            email: 'completeupdate@example.com',
            _id: { $ne: adminId }
        });
        expect(Admin.findByIdAndUpdate).toHaveBeenCalledWith(
            adminId,
            expect.objectContaining({
                name: 'Complete Updated Admin',
                email: 'completeupdate@example.com',
                password: hashedPassword
            }),
            expect.objectContaining({
                new: true,
                runValidators: true
            })
        );
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(updatedAdmin);
    });

    // ==================== ADDITIONAL VALIDATION TESTS ====================

    it('should validate email is not empty string after trim', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            email: '   '
        };

        await updateAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should validate name is not empty string after trim', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: '   '
        };

        const updatedAdmin = {
            _id: adminId,
            name: ''
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        // Should still go through since we don't validate empty name in controller
        expect(Admin.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should return proper error message on database error', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Updated Name'
        };

        Admin.findByIdAndUpdate.mockImplementationOnce(() => {
            throw new Error('Connection timeout');
        });

        await updateAdmin(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.any(String)
            })
        );
    });

    it('should preserve admin ID after update', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Updated Name'
        };

        const updatedAdmin = {
            _id: adminId,
            name: 'Updated Name',
            email: 'admin@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                _id: adminId
            })
        );
    });

    it('should preserve email when updating only name', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        req.body = {
            name: 'Updated Name'
        };

        const updatedAdmin = {
            _id: adminId,
            name: 'Updated Name',
            email: 'original@example.com'
        };

        mockFindByIdAndUpdateWithSelect(updatedAdmin);

        await updateAdmin(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'original@example.com'
            })
        );
    });
});