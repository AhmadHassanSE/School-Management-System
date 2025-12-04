const mongoose = require('mongoose');
const Admin = require('../../models/adminSchema');
const { getAdminDetail } = require('../../controllers/admin-controller');

// Mock the Admin model
jest.mock('../../models/adminSchema');

describe('Admin Profile Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Mock request object
        req = {
            body: {},
            params: {},
            user: {}
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

    // ==================== SUCCESSFUL PROFILE RETRIEVAL TESTS ====================

    it('should retrieve admin profile by ID', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'Admin',
            schoolName: 'Test School',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(Admin.findById).toHaveBeenCalledWith(adminId);
        expect(selectMock).toHaveBeenCalledWith('-password');
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(mockAdmin);
    });

    it('should return admin profile with all required fields', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: 'John Doe',
            email: 'john@example.com',
            role: 'Admin',
            schoolName: 'Primary School',
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-15')
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                _id: adminId,
                name: expect.any(String),
                email: expect.any(String),
                role: expect.any(String),
                schoolName: expect.any(String)
            })
        );
    });

    it('should not expose password in profile response', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'Admin',
            schoolName: 'Test School'
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(selectMock).toHaveBeenCalledWith('-password');
        const responseData = res.json.mock.calls[0][0];
        expect(responseData).not.toHaveProperty('password');
    });

    it('should return admin profile with correct response status', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'Admin',
            schoolName: 'Test School'
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle special characters in admin name', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: 'O\'Brien-Smith, Jr.',
            email: 'admin@example.com',
            role: 'Admin',
            schoolName: 'Test School'
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'O\'Brien-Smith, Jr.'
            })
        );
    });

    it('should populate school details in profile', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'Admin',
            schoolName: 'Central High School'
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                schoolName: 'Central High School'
            })
        );
    });

    // ==================== NON-EXISTENT ADMIN TESTS ====================

    it('should handle non-existent admin ID', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const selectMock = jest.fn().mockResolvedValue(null);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(Admin.findById).toHaveBeenCalledWith(adminId);
        expect(selectMock).toHaveBeenCalledWith('-password');
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/admin|not|found/i)
            })
        );
    });

    it('should return 404 when admin record does not exist', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const selectMock = jest.fn().mockResolvedValue(null);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return proper error message for non-existent admin', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const selectMock = jest.fn().mockResolvedValue(null);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.any(String)
            })
        );
    });

    // ==================== INVALID ID FORMAT TESTS ====================

    it('should handle invalid admin ID format', async () => {
        req.params.id = 'invalid-id-format';

        const selectMock = jest.fn().mockRejectedValue(
            new Error('Cast to ObjectId failed for value "invalid-id-format"')
        );
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.any(String)
            })
        );
    });

    it('should handle malformed ObjectId', async () => {
        req.params.id = '12345';

        const selectMock = jest.fn().mockRejectedValue(
            new Error('Invalid ObjectId')
        );
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle empty ID parameter', async () => {
        req.params.id = '';

        const selectMock = jest.fn().mockRejectedValue(
            new Error('Cast to ObjectId failed')
        );
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle null ID parameter', async () => {
        req.params.id = null;

        const selectMock = jest.fn().mockRejectedValue(
            new Error('Cast to ObjectId failed for value "null"')
        );
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle undefined ID parameter', async () => {
        req.params.id = undefined;

        const selectMock = jest.fn().mockRejectedValue(
            new Error('Cast to ObjectId failed for value "undefined"')
        );
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle special characters in ID', async () => {
        req.params.id = '!@#$%^&*()';

        const selectMock = jest.fn().mockRejectedValue(
            new Error('Cast to ObjectId failed')
        );
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle very long ID string', async () => {
        req.params.id = 'a'.repeat(500);

        const selectMock = jest.fn().mockRejectedValue(
            new Error('Cast to ObjectId failed')
        );
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    // ==================== DATABASE ERROR TESTS ====================

    it('should handle database connection errors', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const dbError = new Error('Database connection error');
        const selectMock = jest.fn().mockRejectedValue(dbError);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.any(String)
            })
        );
    });

    it('should handle database timeout errors', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const timeoutError = new Error('Database query timeout');
        const selectMock = jest.fn().mockRejectedValue(timeoutError);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle validation errors from database', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const validationError = new Error('Validation failed');
        const selectMock = jest.fn().mockRejectedValue(validationError);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle cast errors gracefully', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const castError = new Error('Cast to ObjectId failed');
        const selectMock = jest.fn().mockRejectedValue(castError);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalled();
    });

    // ==================== QUERY CHAIN TESTS ====================

    it('should call select with -password parameter', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const selectMock = jest.fn().mockResolvedValue({
            _id: adminId,
            name: 'Admin User'
        });
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(selectMock).toHaveBeenCalledWith('-password');
    });

    it('should properly chain findById and select methods', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const selectMock = jest.fn().mockResolvedValue({
            _id: adminId,
            name: 'Admin User'
        });
        const findByIdMock = jest.fn().mockReturnValue({
            select: selectMock
        });
        Admin.findById = findByIdMock;

        await getAdminDetail(req, res);

        expect(findByIdMock).toHaveBeenCalledWith(adminId);
        expect(selectMock).toHaveBeenCalledWith('-password');
    });

    // ==================== PROFILE DATA INTEGRITY TESTS ====================

    it('should return profile with consistent data', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: 'Consistent Admin',
            email: 'consistent@example.com',
            role: 'Admin',
            schoolName: 'Consistent School'
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        const responseData = res.json.mock.calls[0][0];
        expect(responseData._id).toBe(adminId);
        expect(responseData.name).toBe('Consistent Admin');
        expect(responseData.email).toBe('consistent@example.com');
    });

    it('should maintain data types in profile response', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'Admin',
            schoolName: 'Test School'
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        const responseData = res.json.mock.calls[0][0];
        expect(typeof responseData._id).toBe('object');
        expect(typeof responseData.name).toBe('string');
        expect(typeof responseData.email).toBe('string');
        expect(typeof responseData.role).toBe('string');
    });

    // ==================== UNICODE AND SPECIAL CHARACTERS TESTS ====================

    it('should handle unicode characters in admin name', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: '张三 (Admin User)',
            email: 'admin@example.com',
            role: 'Admin',
            schoolName: 'Test School'
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                name: '张三 (Admin User)'
            })
        );
    });

    it('should handle unicode characters in school name', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'Admin',
            schoolName: 'مدرسة الأمل (Hope School)'
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                schoolName: 'مدرسة الأمل (Hope School)'
            })
        );
    });

    it('should handle emojis in admin name', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: '👨‍💼 Admin User',
            email: 'admin@example.com',
            role: 'Admin',
            schoolName: 'Test School'
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                name: '👨‍💼 Admin User'
            })
        );
    });

    // ==================== EDGE CASE TESTS ====================

    it('should handle admin profile with all fields populated', async () => {
        const adminId = new mongoose.Types.ObjectId();
        const createdAt = new Date('2024-01-01');
        const updatedAt = new Date('2024-01-15');

        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: 'Full Admin',
            email: 'full@example.com',
            role: 'Admin',
            schoolName: 'Full School',
            createdAt: createdAt,
            updatedAt: updatedAt,
            isActive: true
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                _id: adminId,
                name: 'Full Admin',
                email: 'full@example.com',
                role: 'Admin',
                schoolName: 'Full School'
            })
        );
    });

    it('should handle admin profile with minimal fields', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: 'Minimal Admin',
            email: 'minimal@example.com'
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalled();
    });

    it('should handle admin with very long email address', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const longEmail = 'a'.repeat(100) + '@example.com';
        const mockAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: longEmail,
            role: 'Admin',
            schoolName: 'Test School'
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                email: longEmail
            })
        );
    });

    it('should handle admin with very long school name', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const longSchoolName = 'a'.repeat(200);
        const mockAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'Admin',
            schoolName: longSchoolName
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                schoolName: longSchoolName
            })
        );
    });

    // ==================== RESPONSE STATUS TESTS ====================

    it('should return HTTP 200 status on successful profile retrieval', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com'
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return HTTP 404 status when admin not found', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const selectMock = jest.fn().mockResolvedValue(null);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return HTTP 500 status on database error', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const selectMock = jest.fn().mockRejectedValue(
            new Error('Database error')
        );
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    // ==================== CONCURRENT PROFILE RETRIEVAL TESTS ====================

    it('should handle multiple concurrent profile requests', async () => {
        const adminId1 = new mongoose.Types.ObjectId();
        const adminId2 = new mongoose.Types.ObjectId();

        const mockAdmin1 = {
            _id: adminId1,
            name: 'Admin One',
            email: 'admin1@example.com'
        };

        const mockAdmin2 = {
            _id: adminId2,
            name: 'Admin Two',
            email: 'admin2@example.com'
        };

        const selectMock1 = jest.fn().mockResolvedValue(mockAdmin1);
        const selectMock2 = jest.fn().mockResolvedValue(mockAdmin2);

        Admin.findById
            .mockReturnValueOnce({
                select: selectMock1
            })
            .mockReturnValueOnce({
                select: selectMock2
            });

        req.params.id = adminId1;
        await getAdminDetail(req, res);

        req.params.id = adminId2;
        await getAdminDetail(req, res);

        expect(Admin.findById).toHaveBeenCalledTimes(2);
        expect(Admin.findById).toHaveBeenCalledWith(adminId1);
        expect(Admin.findById).toHaveBeenCalledWith(adminId2);
    });

    // ==================== SECURITY TESTS ====================

    it('should prevent password leakage through select method', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com'
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        // Verify that select is called with -password
        expect(selectMock).toHaveBeenCalledWith('-password');
    });

    it('should not expose sensitive data in profile', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const mockAdmin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'Admin',
            schoolName: 'Test School'
        };

        const selectMock = jest.fn().mockResolvedValue(mockAdmin);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        const responseData = res.json.mock.calls[0][0];
        expect(responseData).not.toHaveProperty('__v');
        expect(responseData).not.toHaveProperty('salt');
        expect(responseData).not.toHaveProperty('password');
    });

    // ==================== ERROR MESSAGE TESTS ====================

    it('should return descriptive error message for non-existent admin', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const selectMock = jest.fn().mockResolvedValue(null);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Admin not found'
            })
        );
    });

    it('should return generic error message for database errors', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const dbError = new Error('Some database error');
        const selectMock = jest.fn().mockRejectedValue(dbError);
        Admin.findById.mockReturnValue({
            select: selectMock
        });

        await getAdminDetail(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.any(String)
            })
        );
    });
});