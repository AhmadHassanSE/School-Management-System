const mongoose = require('mongoose');
const Admin = require('../../models/adminSchema');
const Sclass = require('../../models/sclassSchema');
const Student = require('../../models/studentSchema');
const Teacher = require('../../models/teacherSchema');
const Subject = require('../../models/subjectSchema');
const { getDashboard } = require('../../controllers/admin-controller');

// Mock all models
jest.mock('../../models/adminSchema');
jest.mock('../../models/sclassSchema');
jest.mock('../../models/studentSchema');
jest.mock('../../models/teacherSchema');
jest.mock('../../models/subjectSchema');

describe('Admin Dashboard Tests', () => {
    let req, res;

    beforeEach(() => {
        // Reset all mocks
        Admin.findById.mockClear();
        Sclass.countDocuments.mockClear();
        Student.countDocuments.mockClear();
        Teacher.countDocuments.mockClear();
        Subject.countDocuments.mockClear();

        // Mock request object
        req = {
            params: {}
        };

        // Mock response object
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    });

    // ==================== SUCCESSFUL DASHBOARD RETRIEVAL TESTS ====================

    it('should successfully retrieve complete dashboard statistics', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const admin = {
            _id: adminId,
            name: 'Dashboard Admin',
            email: 'admin@school.com',
            schoolName: 'Test School'
        };

        Admin.findById.mockResolvedValue(admin);
        Student.countDocuments.mockResolvedValue(150);
        Teacher.countDocuments.mockResolvedValue(25);
        Sclass.countDocuments.mockResolvedValue(12);
        Subject.countDocuments.mockResolvedValue(20);

        await getDashboard(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            students: 150,
            teachers: 25,
            classes: 12,
            subjects: 20
        });
    });

    it('should return dashboard with correct status code', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(0);
        Teacher.countDocuments.mockResolvedValue(0);
        Sclass.countDocuments.mockResolvedValue(0);
        Subject.countDocuments.mockResolvedValue(0);

        await getDashboard(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.status).toHaveBeenCalledTimes(1);
    });

    it('should retrieve dashboard for newly created admin', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const newAdmin = {
            _id: adminId,
            name: 'New Admin',
            email: 'new@school.com',
            schoolName: 'New School',
            createdAt: new Date()
        };

        Admin.findById.mockResolvedValue(newAdmin);
        Student.countDocuments.mockResolvedValue(0);
        Teacher.countDocuments.mockResolvedValue(0);
        Sclass.countDocuments.mockResolvedValue(0);
        Subject.countDocuments.mockResolvedValue(0);

        await getDashboard(req, res);

        expect(res.json).toHaveBeenCalledWith({
            students: 0,
            teachers: 0,
            classes: 0,
            subjects: 0
        });
    });

    it('should retrieve dashboard for established school', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(500);
        Teacher.countDocuments.mockResolvedValue(50);
        Sclass.countDocuments.mockResolvedValue(25);
        Subject.countDocuments.mockResolvedValue(30);

        await getDashboard(req, res);

        expect(res.json).toHaveBeenCalledWith({
            students: 500,
            teachers: 50,
            classes: 25,
            subjects: 30
        });
    });

    // ==================== ADMIN VALIDATION TESTS ====================

    it('should verify admin exists before retrieving statistics', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(100);
        Teacher.countDocuments.mockResolvedValue(20);
        Sclass.countDocuments.mockResolvedValue(10);
        Subject.countDocuments.mockResolvedValue(15);

        await getDashboard(req, res);

        expect(Admin.findById).toHaveBeenCalledWith(adminId);
        expect(Student.countDocuments).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent admin', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue(null);

        await getDashboard(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Admin not found'
        });
    });

    it('should not fetch statistics if admin not found', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue(null);

        await getDashboard(req, res);

        expect(Student.countDocuments).not.toHaveBeenCalled();
        expect(Teacher.countDocuments).not.toHaveBeenCalled();
        expect(Sclass.countDocuments).not.toHaveBeenCalled();
        expect(Subject.countDocuments).not.toHaveBeenCalled();
    });

    it('should handle deleted admin gracefully', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue(null);

        await getDashboard(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/not found/i)
            })
        );
    });

    // ==================== STUDENT COUNT TESTS ====================

    it('should count all students for admin school', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(200);
        Teacher.countDocuments.mockResolvedValue(0);
        Sclass.countDocuments.mockResolvedValue(0);
        Subject.countDocuments.mockResolvedValue(0);

        await getDashboard(req, res);

        expect(Student.countDocuments).toHaveBeenCalledWith({ school: adminId });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ students: 200 })
        );
    });

    it('should handle zero students', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(0);
        Teacher.countDocuments.mockResolvedValue(10);
        Sclass.countDocuments.mockResolvedValue(5);
        Subject.countDocuments.mockResolvedValue(8);

        await getDashboard(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ students: 0 })
        );
    });

    it('should handle large student count', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(5000);
        Teacher.countDocuments.mockResolvedValue(200);
        Sclass.countDocuments.mockResolvedValue(50);
        Subject.countDocuments.mockResolvedValue(60);

        await getDashboard(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ students: 5000 })
        );
    });

    // ==================== TEACHER COUNT TESTS ====================

    it('should count all teachers for admin school', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(0);
        Teacher.countDocuments.mockResolvedValue(35);
        Sclass.countDocuments.mockResolvedValue(0);
        Subject.countDocuments.mockResolvedValue(0);

        await getDashboard(req, res);

        expect(Teacher.countDocuments).toHaveBeenCalledWith({ school: adminId });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ teachers: 35 })
        );
    });

    it('should handle single teacher', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(10);
        Teacher.countDocuments.mockResolvedValue(1);
        Sclass.countDocuments.mockResolvedValue(2);
        Subject.countDocuments.mockResolvedValue(3);

        await getDashboard(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ teachers: 1 })
        );
    });

    it('should handle no teachers', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(50);
        Teacher.countDocuments.mockResolvedValue(0);
        Sclass.countDocuments.mockResolvedValue(5);
        Subject.countDocuments.mockResolvedValue(10);

        await getDashboard(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ teachers: 0 })
        );
    });

    // ==================== CLASS COUNT TESTS ====================

    it('should count all classes for admin school', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(0);
        Teacher.countDocuments.mockResolvedValue(0);
        Sclass.countDocuments.mockResolvedValue(15);
        Subject.countDocuments.mockResolvedValue(0);

        await getDashboard(req, res);

        expect(Sclass.countDocuments).toHaveBeenCalledWith({ school: adminId });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ classes: 15 })
        );
    });

    it('should handle single class', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(20);
        Teacher.countDocuments.mockResolvedValue(5);
        Sclass.countDocuments.mockResolvedValue(1);
        Subject.countDocuments.mockResolvedValue(8);

        await getDashboard(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ classes: 1 })
        );
    });

    it('should handle many classes', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(1000);
        Teacher.countDocuments.mockResolvedValue(100);
        Sclass.countDocuments.mockResolvedValue(50);
        Subject.countDocuments.mockResolvedValue(75);

        await getDashboard(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ classes: 50 })
        );
    });

    // ==================== SUBJECT COUNT TESTS ====================

    it('should count all subjects for admin school', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(0);
        Teacher.countDocuments.mockResolvedValue(0);
        Sclass.countDocuments.mockResolvedValue(0);
        Subject.countDocuments.mockResolvedValue(18);

        await getDashboard(req, res);

        expect(Subject.countDocuments).toHaveBeenCalledWith({ school: adminId });
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ subjects: 18 })
        );
    });

    it('should handle minimal subjects', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(30);
        Teacher.countDocuments.mockResolvedValue(8);
        Sclass.countDocuments.mockResolvedValue(3);
        Subject.countDocuments.mockResolvedValue(3);

        await getDashboard(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ subjects: 3 })
        );
    });

    it('should handle comprehensive subject offerings', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(800);
        Teacher.countDocuments.mockResolvedValue(80);
        Sclass.countDocuments.mockResolvedValue(40);
        Subject.countDocuments.mockResolvedValue(45);

        await getDashboard(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ subjects: 45 })
        );
    });

    // ==================== RESPONSE FORMAT TESTS ====================

    it('should return response with exactly four properties', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(100);
        Teacher.countDocuments.mockResolvedValue(20);
        Sclass.countDocuments.mockResolvedValue(10);
        Subject.countDocuments.mockResolvedValue(15);

        await getDashboard(req, res);

        const response = res.json.mock.calls[0][0];
        expect(Object.keys(response)).toHaveLength(4);
    });

    it('should return properties in correct format', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(50);
        Teacher.countDocuments.mockResolvedValue(10);
        Sclass.countDocuments.mockResolvedValue(5);
        Subject.countDocuments.mockResolvedValue(8);

        await getDashboard(req, res);

        const response = res.json.mock.calls[0][0];
        expect(response).toEqual({
            students: expect.any(Number),
            teachers: expect.any(Number),
            classes: expect.any(Number),
            subjects: expect.any(Number)
        });
    });

    it('should return numeric values for all statistics', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(75);
        Teacher.countDocuments.mockResolvedValue(15);
        Sclass.countDocuments.mockResolvedValue(8);
        Subject.countDocuments.mockResolvedValue(12);

        await getDashboard(req, res);

        const response = res.json.mock.calls[0][0];
        expect(typeof response.students).toBe('number');
        expect(typeof response.teachers).toBe('number');
        expect(typeof response.classes).toBe('number');
        expect(typeof response.subjects).toBe('number');
    });

    it('should return non-negative counts', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(0);
        Teacher.countDocuments.mockResolvedValue(0);
        Sclass.countDocuments.mockResolvedValue(0);
        Subject.countDocuments.mockResolvedValue(0);

        await getDashboard(req, res);

        const response = res.json.mock.calls[0][0];
        expect(response.students).toBeGreaterThanOrEqual(0);
        expect(response.teachers).toBeGreaterThanOrEqual(0);
        expect(response.classes).toBeGreaterThanOrEqual(0);
        expect(response.subjects).toBeGreaterThanOrEqual(0);
    });

    // ==================== ERROR HANDLING TESTS ====================

    it('should handle database connection error during admin lookup', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockImplementation(() => {
            throw new Error('Database connection failed');
        });

        await getDashboard(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Database connection failed'
        });
    });

    it('should handle error during student count', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockImplementation(() => {
            throw new Error('Failed to count students');
        });

        await getDashboard(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Failed to count students'
        });
    });

    it('should handle error during teacher count', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(100);
        Teacher.countDocuments.mockImplementation(() => {
            throw new Error('Failed to count teachers');
        });

        await getDashboard(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle error during class count', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(100);
        Teacher.countDocuments.mockResolvedValue(20);
        Sclass.countDocuments.mockImplementation(() => {
            throw new Error('Failed to count classes');
        });

        await getDashboard(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle error during subject count', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(100);
        Teacher.countDocuments.mockResolvedValue(20);
        Sclass.countDocuments.mockResolvedValue(10);
        Subject.countDocuments.mockImplementation(() => {
            throw new Error('Failed to count subjects');
        });

        await getDashboard(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should return error message in response', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockImplementation(() => {
            throw new Error('Timeout error');
        });

        await getDashboard(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.any(String)
            })
        );
    });

    it('should handle invalid admin ID format', async () => {
        req.params.id = 'invalid-id-format';

        Admin.findById.mockImplementation(() => {
            throw new Error('Cast to ObjectId failed');
        });

        await getDashboard(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    // ==================== SCHOOL ISOLATION TESTS ====================

    it('should only count entities for specific admin school', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(100);
        Teacher.countDocuments.mockResolvedValue(20);
        Sclass.countDocuments.mockResolvedValue(10);
        Subject.countDocuments.mockResolvedValue(15);

        await getDashboard(req, res);

        expect(Student.countDocuments).toHaveBeenCalledWith({ school: adminId });
        expect(Teacher.countDocuments).toHaveBeenCalledWith({ school: adminId });
        expect(Sclass.countDocuments).toHaveBeenCalledWith({ school: adminId });
        expect(Subject.countDocuments).toHaveBeenCalledWith({ school: adminId });
    });

    it('should handle multiple schools with different admin IDs', async () => {
        const adminId1 = new mongoose.Types.ObjectId();
        const adminId2 = new mongoose.Types.ObjectId();

        // First school
        req.params.id = adminId1;
        Admin.findById.mockResolvedValueOnce({ _id: adminId1 });
        Student.countDocuments.mockResolvedValue(100);
        Teacher.countDocuments.mockResolvedValue(20);
        Sclass.countDocuments.mockResolvedValue(10);
        Subject.countDocuments.mockResolvedValue(15);

        await getDashboard(req, res);

        expect(Student.countDocuments).toHaveBeenCalledWith({ school: adminId1 });

        // Reset mocks
        jest.clearAllMocks();

        // Second school
        req.params.id = adminId2;
        Admin.findById.mockResolvedValueOnce({ _id: adminId2 });
        Student.countDocuments.mockResolvedValue(50);
        Teacher.countDocuments.mockResolvedValue(10);
        Sclass.countDocuments.mockResolvedValue(5);
        Subject.countDocuments.mockResolvedValue(8);

        await getDashboard(req, res);

        expect(Student.countDocuments).toHaveBeenCalledWith({ school: adminId2 });
    });

    it('should not leak data between different admin schools', async () => {
        const adminId1 = new mongoose.Types.ObjectId();
        const adminId2 = new mongoose.Types.ObjectId();

        req.params.id = adminId1;
        Admin.findById.mockResolvedValue({ _id: adminId1 });
        Student.countDocuments.mockResolvedValue(100);
        Teacher.countDocuments.mockResolvedValue(20);
        Sclass.countDocuments.mockResolvedValue(10);
        Subject.countDocuments.mockResolvedValue(15);

        await getDashboard(req, res);

        const firstResponse = res.json.mock.calls[0][0];

        // Different admin
        jest.clearAllMocks();
        req.params.id = adminId2;
        Admin.findById.mockResolvedValue({ _id: adminId2 });
        Student.countDocuments.mockResolvedValue(50);
        Teacher.countDocuments.mockResolvedValue(10);
        Sclass.countDocuments.mockResolvedValue(5);
        Subject.countDocuments.mockResolvedValue(8);

        await getDashboard(req, res);

        const secondResponse = res.json.mock.calls[0][0];

        expect(firstResponse).not.toEqual(secondResponse);
    });

    // ==================== PERFORMANCE AND EDGE CASE TESTS ====================

    it('should handle extremely large school', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(50000);
        Teacher.countDocuments.mockResolvedValue(2000);
        Sclass.countDocuments.mockResolvedValue(500);
        Subject.countDocuments.mockResolvedValue(250);

        await getDashboard(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            students: 50000,
            teachers: 2000,
            classes: 500,
            subjects: 250
        });
    });

    it('should complete dashboard retrieval quickly', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(100);
        Teacher.countDocuments.mockResolvedValue(20);
        Sclass.countDocuments.mockResolvedValue(10);
        Subject.countDocuments.mockResolvedValue(15);

        const startTime = Date.now();
        await getDashboard(req, res);
        const endTime = Date.now();

        expect(endTime - startTime).toBeLessThan(100); // Should be very fast with mocks
    });

    it('should handle concurrent dashboard requests for same admin', async () => {
        const adminId = new mongoose.Types.ObjectId();
        
        const req1 = { params: { id: adminId } };
        const req2 = { params: { id: adminId } };
        
        const res1 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        
        const res2 = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(100);
        Teacher.countDocuments.mockResolvedValue(20);
        Sclass.countDocuments.mockResolvedValue(10);
        Subject.countDocuments.mockResolvedValue(15);

        await Promise.all([
            getDashboard(req1, res1),
            getDashboard(req2, res2)
        ]);

        expect(res1.status).toHaveBeenCalledWith(200);
        expect(res2.status).toHaveBeenCalledWith(200);
    });

    it('should maintain consistent response structure', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Student.countDocuments.mockResolvedValue(75);
        Teacher.countDocuments.mockResolvedValue(15);
        Sclass.countDocuments.mockResolvedValue(8);
        Subject.countDocuments.mockResolvedValue(12);

        await getDashboard(req, res);

        const response = res.json.mock.calls[0][0];
        const keys = Object.keys(response);

        expect(keys).toEqual(['students', 'teachers', 'classes', 'subjects']);
    });

    it('should handle realistic school proportions', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        // Realistic proportions: 25:1 student-teacher ratio, 20 students per class
        Student.countDocuments.mockResolvedValue(500);
        Teacher.countDocuments.mockResolvedValue(20);
        Sclass.countDocuments.mockResolvedValue(25);
        Subject.countDocuments.mockResolvedValue(15);

        await getDashboard(req, res);

        const response = res.json.mock.calls[0][0];
        expect(response.students).toBeGreaterThan(response.teachers);
        expect(response.students).toBeGreaterThan(response.classes);
    });
});
