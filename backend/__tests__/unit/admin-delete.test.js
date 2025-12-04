const mongoose = require('mongoose');
const Admin = require('../../models/adminSchema');
const Sclass = require('../../models/sclassSchema');
const Student = require('../../models/studentSchema');
const Teacher = require('../../models/teacherSchema');
const Subject = require('../../models/subjectSchema');
const Notice = require('../../models/noticeSchema');
const Complain = require('../../models/complainSchema');
const { deleteAdmin } = require('../../controllers/admin-controller');

// Mock all models
jest.mock('../../models/adminSchema');
jest.mock('../../models/sclassSchema');
jest.mock('../../models/studentSchema');
jest.mock('../../models/teacherSchema');
jest.mock('../../models/subjectSchema');
jest.mock('../../models/noticeSchema');
jest.mock('../../models/complainSchema');

describe('Admin Delete Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        // Reset specific mocks
        Admin.findById.mockClear();
        Admin.findByIdAndDelete.mockClear();
        Sclass.deleteMany.mockClear();
        Student.deleteMany.mockClear();
        Teacher.deleteMany.mockClear();
        Subject.deleteMany.mockClear();
        Notice.deleteMany.mockClear();
        Complain.deleteMany.mockClear();

        // Mock request object
        req = {
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

    // ==================== SUCCESSFUL DELETION TESTS ====================

    it('should successfully delete admin with valid ID', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const admin = {
            _id: adminId,
            name: 'Admin User',
            email: 'admin@example.com'
        };

        Admin.findById.mockResolvedValue(admin);
        Admin.findByIdAndDelete.mockResolvedValue(admin);
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 5 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 100 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 20 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 15 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 10 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 5 });

        await deleteAdmin(req, res);

        expect(Admin.findById).toHaveBeenCalledWith(adminId);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Admin and all related data deleted successfully'
        });
    });

    it('should delete admin and call findByIdAndDelete', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Admin.findByIdAndDelete.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 0 });

        await deleteAdmin(req, res);

        expect(Admin.findByIdAndDelete).toHaveBeenCalledWith(adminId);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return success message with correct text', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Admin.findByIdAndDelete.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 0 });

        await deleteAdmin(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/Admin and all related data deleted successfully/i)
            })
        );
    });

    // ==================== RELATED DATA DELETION TESTS ====================

    it('should delete all classes associated with admin', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Admin.findByIdAndDelete.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 5 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 0 });

        await deleteAdmin(req, res);

        expect(Sclass.deleteMany).toHaveBeenCalledWith({ school: adminId });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should delete all students associated with admin', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Admin.findByIdAndDelete.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 100 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 0 });

        await deleteAdmin(req, res);

        expect(Student.deleteMany).toHaveBeenCalledWith({ school: adminId });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should delete all teachers associated with admin', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Admin.findByIdAndDelete.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 20 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 0 });

        await deleteAdmin(req, res);

        expect(Teacher.deleteMany).toHaveBeenCalledWith({ school: adminId });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should delete all subjects associated with admin', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Admin.findByIdAndDelete.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 15 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 0 });

        await deleteAdmin(req, res);

        expect(Subject.deleteMany).toHaveBeenCalledWith({ school: adminId });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should delete all notices associated with admin', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Admin.findByIdAndDelete.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 10 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 0 });

        await deleteAdmin(req, res);

        expect(Notice.deleteMany).toHaveBeenCalledWith({ school: adminId });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should delete all complains associated with admin', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Admin.findByIdAndDelete.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 5 });

        await deleteAdmin(req, res);

        expect(Complain.deleteMany).toHaveBeenCalledWith({ school: adminId });
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should delete all related data in correct order', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Admin.findByIdAndDelete.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 5 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 100 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 20 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 15 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 10 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 5 });

        await deleteAdmin(req, res);

        // Verify all deletions happened
        expect(Sclass.deleteMany).toHaveBeenCalled();
        expect(Student.deleteMany).toHaveBeenCalled();
        expect(Teacher.deleteMany).toHaveBeenCalled();
        expect(Subject.deleteMany).toHaveBeenCalled();
        expect(Notice.deleteMany).toHaveBeenCalled();
        expect(Complain.deleteMany).toHaveBeenCalled();
        expect(Admin.findByIdAndDelete).toHaveBeenCalled();
    });

    it('should delete admin after deleting all related data', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;
        const callOrder = [];

        Admin.findById.mockResolvedValue({ _id: adminId });
        Admin.findByIdAndDelete.mockImplementation(() => {
            callOrder.push('admin');
            return Promise.resolve({ _id: adminId });
        });
        Sclass.deleteMany.mockImplementation(() => {
            callOrder.push('sclass');
            return Promise.resolve({ deletedCount: 0 });
        });
        Student.deleteMany.mockImplementation(() => {
            callOrder.push('student');
            return Promise.resolve({ deletedCount: 0 });
        });
        Teacher.deleteMany.mockImplementation(() => {
            callOrder.push('teacher');
            return Promise.resolve({ deletedCount: 0 });
        });
        Subject.deleteMany.mockImplementation(() => {
            callOrder.push('subject');
            return Promise.resolve({ deletedCount: 0 });
        });
        Notice.deleteMany.mockImplementation(() => {
            callOrder.push('notice');
            return Promise.resolve({ deletedCount: 0 });
        });
        Complain.deleteMany.mockImplementation(() => {
            callOrder.push('complain');
            return Promise.resolve({ deletedCount: 0 });
        });

        await deleteAdmin(req, res);

        // Admin deletion should be last
        expect(callOrder[callOrder.length - 1]).toBe('admin');
    });

    // ==================== NON-EXISTENT ADMIN TESTS ====================

    it('should return 404 when admin does not exist', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue(null);

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Admin not found'
        });
    });

    it('should not delete related data if admin not found', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue(null);

        await deleteAdmin(req, res);

        expect(Sclass.deleteMany).not.toHaveBeenCalled();
        expect(Student.deleteMany).not.toHaveBeenCalled();
        expect(Teacher.deleteMany).not.toHaveBeenCalled();
        expect(Subject.deleteMany).not.toHaveBeenCalled();
        expect(Notice.deleteMany).not.toHaveBeenCalled();
        expect(Complain.deleteMany).not.toHaveBeenCalled();
        expect(Admin.findByIdAndDelete).not.toHaveBeenCalled();
    });

    it('should return proper error message for non-existent admin', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue(null);

        await deleteAdmin(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/admin|not|found/i)
            })
        );
    });

    // ==================== DATABASE ERROR TESTS ====================

    it('should handle database errors during admin lookup', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockImplementationOnce(() => {
            throw new Error('Database connection error');
        });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.any(String)
            })
        );
    });

    it('should handle errors during class deletion', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockImplementationOnce(() => {
            throw new Error('Failed to delete classes');
        });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors during student deletion', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockImplementationOnce(() => {
            throw new Error('Failed to delete students');
        });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors during teacher deletion', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockImplementationOnce(() => {
            throw new Error('Failed to delete teachers');
        });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors during subject deletion', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockImplementationOnce(() => {
            throw new Error('Failed to delete subjects');
        });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors during notice deletion', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockImplementationOnce(() => {
            throw new Error('Failed to delete notices');
        });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors during complain deletion', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Complain.deleteMany.mockImplementationOnce(() => {
            throw new Error('Failed to delete complains');
        });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors during admin deletion', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Admin.findByIdAndDelete.mockImplementationOnce(() => {
            throw new Error('Failed to delete admin');
        });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should return proper error message on database error', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockImplementationOnce(() => {
            throw new Error('Connection timeout');
        });

        await deleteAdmin(req, res);

        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringMatching(/Connection timeout/i)
            })
        );
    });

    // ==================== EDGE CASES ====================

    it('should handle deletion with no related data', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Admin.findByIdAndDelete.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 0 });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Admin and all related data deleted successfully'
        });
    });

    it('should handle deletion with large amount of related data', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Admin.findByIdAndDelete.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 50 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 10000 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 500 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 200 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 1000 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 300 });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle invalid ObjectId format gracefully', async () => {
        req.params.id = 'invalid-id';

        Admin.findById.mockImplementationOnce(() => {
            throw new Error('Cast to ObjectId failed');
        });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should use correct admin ID for all deletion operations', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Admin.findByIdAndDelete.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 0 });

        await deleteAdmin(req, res);

        expect(Admin.findById).toHaveBeenCalledWith(adminId);
        expect(Sclass.deleteMany).toHaveBeenCalledWith({ school: adminId });
        expect(Student.deleteMany).toHaveBeenCalledWith({ school: adminId });
        expect(Teacher.deleteMany).toHaveBeenCalledWith({ school: adminId });
        expect(Subject.deleteMany).toHaveBeenCalledWith({ school: adminId });
        expect(Notice.deleteMany).toHaveBeenCalledWith({ school: adminId });
        expect(Complain.deleteMany).toHaveBeenCalledWith({ school: adminId });
        expect(Admin.findByIdAndDelete).toHaveBeenCalledWith(adminId);
    });

    // ==================== CONCURRENT DELETION TESTS ====================

    it('should handle multiple concurrent deletion requests', async () => {
        const adminId1 = new mongoose.Types.ObjectId();
        const adminId2 = new mongoose.Types.ObjectId();

        req.params.id = adminId1;

        Admin.findById.mockResolvedValueOnce({ _id: adminId1 });
        Admin.findByIdAndDelete.mockResolvedValueOnce({ _id: adminId1 });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 0 });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(200);

        // Second deletion
        req.params.id = adminId2;
        Admin.findById.mockResolvedValueOnce({ _id: adminId2 });
        Admin.findByIdAndDelete.mockResolvedValueOnce({ _id: adminId2 });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.status).toHaveBeenCalledTimes(2);
    });

    // ==================== VALIDATION TESTS ====================

    it('should check if admin exists before deletion', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Admin.findByIdAndDelete.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 0 });

        await deleteAdmin(req, res);

        // Verify Admin.findById was called
        expect(Admin.findById).toHaveBeenCalledWith(adminId);
        expect(Admin.findByIdAndDelete).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 200 status code on successful deletion', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        Admin.findById.mockResolvedValue({ _id: adminId });
        Admin.findByIdAndDelete.mockResolvedValue({ _id: adminId });
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 0 });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle admin with minimal data', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const minimalAdmin = {
            _id: adminId
        };

        Admin.findById.mockResolvedValue(minimalAdmin);
        Admin.findByIdAndDelete.mockResolvedValue(minimalAdmin);
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 0 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 0 });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle admin with complete data structure', async () => {
        const adminId = new mongoose.Types.ObjectId();
        req.params.id = adminId;

        const completeAdmin = {
            _id: adminId,
            name: 'Complete Admin',
            email: 'complete@example.com',
            password: 'hashedpassword',
            role: 'Admin',
            schoolName: 'Complete School',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        Admin.findById.mockResolvedValue(completeAdmin);
        Admin.findByIdAndDelete.mockResolvedValue(completeAdmin);
        Sclass.deleteMany.mockResolvedValue({ deletedCount: 10 });
        Student.deleteMany.mockResolvedValue({ deletedCount: 200 });
        Teacher.deleteMany.mockResolvedValue({ deletedCount: 30 });
        Subject.deleteMany.mockResolvedValue({ deletedCount: 25 });
        Notice.deleteMany.mockResolvedValue({ deletedCount: 50 });
        Complain.deleteMany.mockResolvedValue({ deletedCount: 15 });

        await deleteAdmin(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
    });
});
