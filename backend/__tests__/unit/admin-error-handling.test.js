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

describe('Admin Error Handling Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
        jest.clearAllMocks();
    });

    // ===== ADMIN REGISTRATION ERROR HANDLING =====
    describe('Admin Registration - Error Handling', () => {
        
        test('should handle database error during admin creation', async () => {
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            bcrypt.hash.mockResolvedValueOnce('hashedPassword');
            const dbError = new Error('Database connection failed');
            Admin.mockImplementationOnce(() => ({
                save: jest.fn().mockRejectedValueOnce(dbError)
            }));

            await adminRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Database connection failed'
            });
        });

        test('should handle unique constraint violation on email', async () => {
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            bcrypt.hash.mockResolvedValueOnce('hashedPassword');
            const uniqueError = new Error('E11000 duplicate key error');
            Admin.mockImplementationOnce(() => ({
                save: jest.fn().mockRejectedValueOnce(uniqueError)
            }));

            await adminRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'E11000 duplicate key error'
            });
        });

        test('should handle bcrypt hash error during registration', async () => {
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            const hashError = new Error('Bcrypt hashing failed');
            bcrypt.hash.mockRejectedValueOnce(hashError);

            await adminRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Bcrypt hashing failed'
            });
        });

        test('should handle database query error when checking existing email', async () => {
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            const dbError = new Error('Database query failed');
            Admin.findOne.mockRejectedValueOnce(dbError);

            await adminRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Database query failed'
            });
        });

        test('should handle validation error from schema', async () => {
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            bcrypt.hash.mockResolvedValueOnce('hashedPassword');
            const validationError = new Error('Validation error: Invalid field');
            Admin.mockImplementationOnce(() => ({
                save: jest.fn().mockRejectedValueOnce(validationError)
            }));

            await adminRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Validation error: Invalid field'
            });
        });

        test('should handle network timeout during registration', async () => {
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            bcrypt.hash.mockResolvedValueOnce('hashedPassword');
            const timeoutError = new Error('Request timeout');
            Admin.mockImplementationOnce(() => ({
                save: jest.fn().mockRejectedValueOnce(timeoutError)
            }));

            await adminRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Request timeout'
            });
        });
    });

    // ===== ADMIN LOGIN ERROR HANDLING =====
    describe('Admin Login - Error Handling', () => {
        
        test('should handle database error during login email lookup', async () => {
            req.body = {
                email: 'admin@school.com',
                password: 'password123'
            };

            const dbError = new Error('Database connection failed');
            Admin.findOne.mockRejectedValueOnce(dbError);

            await adminLogIn(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Database connection failed'
            });
        });

        test('should handle bcrypt comparison error during login', async () => {
            req.body = {
                email: 'admin@school.com',
                password: 'password123'
            };

            Admin.findOne.mockResolvedValueOnce({
                _id: '123',
                email: 'admin@school.com',
                password: 'hashedPassword'
            });

            const bcryptError = new Error('Bcrypt comparison failed');
            bcrypt.compare.mockRejectedValueOnce(bcryptError);

            await adminLogIn(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Bcrypt comparison failed'
            });
        });

        test('should handle connection pool exhaustion during login', async () => {
            req.body = {
                email: 'admin@school.com',
                password: 'password123'
            };

            const poolError = new Error('Connection pool exhausted');
            Admin.findOne.mockRejectedValueOnce(poolError);

            await adminLogIn(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Connection pool exhausted'
            });
        });
    });

    // ===== GET ADMIN DETAIL ERROR HANDLING =====
    describe('Get Admin Detail - Error Handling', () => {
        
        test('should handle database error when fetching admin detail', async () => {
            req.params.id = '123';

            const dbError = new Error('Database read failed');
            Admin.findById.mockReturnValueOnce({
                select: jest.fn().mockRejectedValueOnce(dbError)
            });

            await getAdminDetail(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Database read failed'
            });
        });

        test('should handle invalid ObjectId format', async () => {
            req.params.id = 'invalid-id-format';

            const castError = new Error('Cast to ObjectId failed');
            Admin.findById.mockReturnValueOnce({
                select: jest.fn().mockRejectedValueOnce(castError)
            });

            await getAdminDetail(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Cast to ObjectId failed'
            });
        });

        test('should handle corrupted admin record data', async () => {
            req.params.id = '123';

            const dataError = new Error('Corrupted document in database');
            Admin.findById.mockReturnValueOnce({
                select: jest.fn().mockRejectedValueOnce(dataError)
            });

            await getAdminDetail(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Corrupted document in database'
            });
        });
    });

    // ===== GET ALL ADMINS ERROR HANDLING =====
    describe('Get All Admins - Error Handling', () => {
        
        test('should handle database error when fetching all admins', async () => {
            const dbError = new Error('Database read failed');
            Admin.find.mockReturnValueOnce({
                select: jest.fn().mockRejectedValueOnce(dbError)
            });

            await getAllAdmins(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Database read failed'
            });
        });

        test('should handle database timeout when fetching all admins', async () => {
            const timeoutError = new Error('Query timeout');
            Admin.find.mockReturnValueOnce({
                select: jest.fn().mockRejectedValueOnce(timeoutError)
            });

            await getAllAdmins(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Query timeout'
            });
        });

        test('should handle database connection loss during fetching admins', async () => {
            const connectionError = new Error('Lost connection to database');
            Admin.find.mockReturnValueOnce({
                select: jest.fn().mockRejectedValueOnce(connectionError)
            });

            await getAllAdmins(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Lost connection to database'
            });
        });
    });

    // ===== UPDATE ADMIN ERROR HANDLING =====
    describe('Update Admin - Error Handling', () => {
        
        test('should handle database error when checking duplicate email', async () => {
            req.params.id = '123';
            req.body = {
                email: 'newemail@school.com'
            };

            const dbError = new Error('Database query failed');
            Admin.findOne.mockRejectedValueOnce(dbError);

            await updateAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Database query failed'
            });
        });

        test('should handle bcrypt hash error during password update', async () => {
            req.params.id = '123';
            req.body = {
                password: 'newpassword123'
            };

            const hashError = new Error('Bcrypt hashing failed');
            bcrypt.hash.mockRejectedValueOnce(hashError);

            await updateAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Bcrypt hashing failed'
            });
        });

        test('should handle database error during admin update', async () => {
            req.params.id = '123';
            req.body = {
                name: 'Updated Admin'
            };

            const dbError = new Error('Update failed');
            Admin.findByIdAndUpdate.mockReturnValueOnce({
                select: jest.fn().mockRejectedValueOnce(dbError)
            });

            await updateAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Update failed'
            });
        });

        test('should handle concurrent update conflicts', async () => {
            req.params.id = '123';
            req.body = {
                name: 'Updated Admin'
            };

            const conflictError = new Error('Version conflict: Document was modified');
            Admin.findByIdAndUpdate.mockReturnValueOnce({
                select: jest.fn().mockRejectedValueOnce(conflictError)
            });

            await updateAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Version conflict: Document was modified'
            });
        });

        test('should handle validation error during update', async () => {
            req.params.id = '123';
            req.body = {
                email: 'newemail@school.com'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            const validationError = new Error('Validation error: Invalid email');
            Admin.findByIdAndUpdate.mockReturnValueOnce({
                select: jest.fn().mockRejectedValueOnce(validationError)
            });

            await updateAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Validation error: Invalid email'
            });
        });
    });

    // ===== DELETE ADMIN ERROR HANDLING =====
    describe('Delete Admin - Error Handling', () => {
        
        test('should handle database error when finding admin to delete', async () => {
            req.params.id = '123';

            const dbError = new Error('Database read failed');
            Admin.findById.mockRejectedValueOnce(dbError);

            await deleteAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Database read failed'
            });
        });

        test('should handle error when deleting related classes', async () => {
            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            const dbError = new Error('Failed to delete classes');
            Sclass.deleteMany.mockRejectedValueOnce(dbError);

            await deleteAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Failed to delete classes'
            });
        });

        test('should handle error when deleting related students', async () => {
            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            Sclass.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });

            const dbError = new Error('Failed to delete students');
            Student.deleteMany.mockRejectedValueOnce(dbError);

            await deleteAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Failed to delete students'
            });
        });

        test('should handle error when deleting related teachers', async () => {
            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            Sclass.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
            Student.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });

            const dbError = new Error('Failed to delete teachers');
            Teacher.deleteMany.mockRejectedValueOnce(dbError);

            await deleteAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Failed to delete teachers'
            });
        });

        test('should handle error when deleting related subjects', async () => {
            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            Sclass.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
            Student.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
            Teacher.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });

            const dbError = new Error('Failed to delete subjects');
            Subject.deleteMany.mockRejectedValueOnce(dbError);

            await deleteAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Failed to delete subjects'
            });
        });

        test('should handle error when deleting related notices', async () => {
            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            Sclass.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
            Student.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
            Teacher.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
            Subject.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });

            const dbError = new Error('Failed to delete notices');
            Notice.deleteMany.mockRejectedValueOnce(dbError);

            await deleteAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Failed to delete notices'
            });
        });

        test('should handle error when deleting related complaints', async () => {
            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            Sclass.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
            Student.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
            Teacher.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
            Subject.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
            Notice.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });

            const dbError = new Error('Failed to delete complaints');
            Complain.deleteMany.mockRejectedValueOnce(dbError);

            await deleteAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Failed to delete complaints'
            });
        });

        test('should handle error when deleting admin after cascade delete', async () => {
            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            Sclass.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
            Student.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
            Teacher.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
            Subject.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
            Notice.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
            Complain.deleteMany.mockResolvedValueOnce({ deletedCount: 0 });

            const dbError = new Error('Failed to delete admin');
            Admin.findByIdAndDelete.mockRejectedValueOnce(dbError);

            await deleteAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Failed to delete admin'
            });
        });

        test('should handle partial failure during cascade delete', async () => {
            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            Sclass.deleteMany.mockResolvedValueOnce({ deletedCount: 5 });
            Student.deleteMany.mockResolvedValueOnce({ deletedCount: 50 });
            
            const dbError = new Error('Partial failure: Could not delete all teachers');
            Teacher.deleteMany.mockRejectedValueOnce(dbError);

            await deleteAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Partial failure: Could not delete all teachers'
            });
        });
    });

    // ===== GET DASHBOARD ERROR HANDLING =====
    describe('Get Dashboard - Error Handling', () => {
        
        test('should handle database error when finding admin for dashboard', async () => {
            req.params.id = '123';

            const dbError = new Error('Database read failed');
            Admin.findById.mockRejectedValueOnce(dbError);

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Database read failed'
            });
        });

        test('should handle error when counting students', async () => {
            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            const dbError = new Error('Failed to count students');
            Student.countDocuments.mockRejectedValueOnce(dbError);

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Failed to count students'
            });
        });

        test('should handle error when counting teachers', async () => {
            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            Student.countDocuments.mockResolvedValueOnce(50);

            const dbError = new Error('Failed to count teachers');
            Teacher.countDocuments.mockRejectedValueOnce(dbError);

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Failed to count teachers'
            });
        });

        test('should handle error when counting classes', async () => {
            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            Student.countDocuments.mockResolvedValueOnce(50);
            Teacher.countDocuments.mockResolvedValueOnce(10);

            const dbError = new Error('Failed to count classes');
            Sclass.countDocuments.mockRejectedValueOnce(dbError);

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Failed to count classes'
            });
        });

        test('should handle error when counting subjects', async () => {
            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            Student.countDocuments.mockResolvedValueOnce(50);
            Teacher.countDocuments.mockResolvedValueOnce(10);
            Sclass.countDocuments.mockResolvedValueOnce(5);

            const dbError = new Error('Failed to count subjects');
            Subject.countDocuments.mockRejectedValueOnce(dbError);

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Failed to count subjects'
            });
        });

        test('should handle aggregation pipeline error in dashboard', async () => {
            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            const aggregationError = new Error('Aggregation pipeline error');
            Student.countDocuments.mockRejectedValueOnce(aggregationError);

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Aggregation pipeline error'
            });
        });

        test('should handle timeout during dashboard statistics retrieval', async () => {
            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            const timeoutError = new Error('Dashboard query timeout');
            Student.countDocuments.mockRejectedValueOnce(timeoutError);

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Dashboard query timeout'
            });
        });
    });

    // ===== COMPREHENSIVE ERROR SCENARIOS =====
    describe('Comprehensive Error Scenarios', () => {
        
        test('should handle multiple sequential database failures', async () => {
            req.params.id = '123';

            const dbError = new Error('Multiple database failures');
            Admin.findById.mockRejectedValueOnce(dbError);

            await deleteAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Multiple database failures'
            });
        });

        test('should handle errors with special characters in message', async () => {
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            bcrypt.hash.mockResolvedValueOnce('hashedPassword');
            const specialError = new Error('Error: "invalid" data <script>');
            Admin.mockImplementationOnce(() => ({
                save: jest.fn().mockRejectedValueOnce(specialError)
            }));

            await adminRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Error: "invalid" data <script>'
            });
        });

        test('should handle null error message gracefully', async () => {
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            bcrypt.hash.mockResolvedValueOnce('hashedPassword');
            const nullError = new Error();
            nullError.message = null;
            Admin.mockImplementationOnce(() => ({
                save: jest.fn().mockRejectedValueOnce(nullError)
            }));

            await adminRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalled();
        });

        test('should handle undefined error object', async () => {
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            bcrypt.hash.mockResolvedValueOnce('hashedPassword');
            const unknownError = {};
            Admin.mockImplementationOnce(() => ({
                save: jest.fn().mockRejectedValueOnce(unknownError)
            }));

            await adminRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalled();
        });

        test('should handle very long error messages', async () => {
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            bcrypt.hash.mockResolvedValueOnce('hashedPassword');
            const longErrorMessage = 'Database Error: ' + 'a'.repeat(1000);
            const longError = new Error(longErrorMessage);
            Admin.mockImplementationOnce(() => ({
                save: jest.fn().mockRejectedValueOnce(longError)
            }));

            await adminRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: longErrorMessage
            });
        });

        test('should handle race condition errors', async () => {
            req.params.id = '123';

            Admin.findById.mockResolvedValueOnce({
                _id: '123',
                name: 'Admin'
            });

            Sclass.deleteMany.mockResolvedValueOnce({ deletedCount: 5 });
            Student.deleteMany.mockResolvedValueOnce({ deletedCount: 50 });
            Teacher.deleteMany.mockResolvedValueOnce({ deletedCount: 10 });
            Subject.deleteMany.mockResolvedValueOnce({ deletedCount: 20 });
            Notice.deleteMany.mockResolvedValueOnce({ deletedCount: 15 });
            
            const raceError = new Error('Document was already deleted by another process');
            Complain.deleteMany.mockRejectedValueOnce(raceError);

            await deleteAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Document was already deleted by another process'
            });
        });

        test('should handle memory allocation error', async () => {
            req.body = {
                name: 'Admin',
                email: 'admin@school.com',
                password: 'password123',
                schoolName: 'Test School'
            };

            Admin.findOne.mockResolvedValueOnce(null);
            bcrypt.hash.mockResolvedValueOnce('hashedPassword');
            const memoryError = new Error('Out of memory');
            Admin.mockImplementationOnce(() => ({
                save: jest.fn().mockRejectedValueOnce(memoryError)
            }));

            await adminRegister(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Out of memory'
            });
        });

        test('should handle network errors during operations', async () => {
            req.body = {
                email: 'admin@school.com',
                password: 'password123'
            };

            const networkError = new Error('ECONNREFUSED: Connection refused');
            Admin.findOne.mockRejectedValueOnce(networkError);

            await adminLogIn(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'ECONNREFUSED: Connection refused'
            });
        });
    });
});
