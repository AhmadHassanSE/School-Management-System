const mongoose = require('mongoose');
const Admin = require('../../models/adminSchema');
const Sclass = require('../../models/sclassSchema');
const Student = require('../../models/studentSchema');
const Teacher = require('../../models/teacherSchema');
const Subject = require('../../models/subjectSchema');
const { getAllAdmins, getDashboard } = require('../../controllers/admin-controller');

// Mock all models
jest.mock('../../models/adminSchema');
jest.mock('../../models/sclassSchema');
jest.mock('../../models/studentSchema');
jest.mock('../../models/teacherSchema');
jest.mock('../../models/subjectSchema');

describe('Admin School Management Tests', () => {
    let req, res;

    beforeEach(() => {
        // Reset all mocks
        Admin.find.mockClear();
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
            json: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis()
        };
    });

    afterAll(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }
    });

    // ==================== GET ALL ADMINS TESTS ====================

    describe('getAllAdmins', () => {
        it('should successfully retrieve all admins', async () => {
            const admins = [
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'Admin One',
                    email: 'admin1@example.com',
                    role: 'Admin',
                    schoolName: 'School One'
                },
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'Admin Two',
                    email: 'admin2@example.com',
                    role: 'Admin',
                    schoolName: 'School Two'
                }
            ];

            Admin.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(admins)
            });

            await getAllAdmins(req, res);

            expect(Admin.find).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(admins);
        });

        it('should exclude password field from admin data', async () => {
            const admins = [
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'Admin One',
                    email: 'admin1@example.com'
                }
            ];

            const selectMock = jest.fn().mockResolvedValue(admins);
            Admin.find.mockReturnValue({
                select: selectMock
            });

            await getAllAdmins(req, res);

            expect(selectMock).toHaveBeenCalledWith('-password');
        });

        it('should return empty array when no admins exist', async () => {
            Admin.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([])
            });

            await getAllAdmins(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        it('should return multiple admins with complete data', async () => {
            const admins = [
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'Admin One',
                    email: 'admin1@example.com',
                    role: 'Admin',
                    schoolName: 'School One'
                },
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'Admin Two',
                    email: 'admin2@example.com',
                    role: 'Admin',
                    schoolName: 'School Two'
                },
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'Admin Three',
                    email: 'admin3@example.com',
                    role: 'Admin',
                    schoolName: 'School Three'
                }
            ];

            Admin.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(admins)
            });

            await getAllAdmins(req, res);

            expect(res.json).toHaveBeenCalledWith(admins);
            expect(res.json.mock.calls[0][0]).toHaveLength(3);
        });

        it('should handle single admin in database', async () => {
            const admins = [
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'Solo Admin',
                    email: 'solo@example.com',
                    role: 'Admin',
                    schoolName: 'Solo School'
                }
            ];

            Admin.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(admins)
            });

            await getAllAdmins(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(admins);
            expect(res.json.mock.calls[0][0]).toHaveLength(1);
        });

        it('should handle database errors gracefully', async () => {
            Admin.find.mockReturnValue({
                select: jest.fn().mockImplementation(() => {
                    throw new Error('Database connection error');
                })
            });

            await getAllAdmins(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.any(String)
                })
            );
        });

        it('should return 500 on query execution error', async () => {
            Admin.find.mockImplementation(() => {
                throw new Error('Query execution failed');
            });

            await getAllAdmins(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Query execution failed'
            });
        });

        it('should handle admins with different roles', async () => {
            const admins = [
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'Super Admin',
                    email: 'super@example.com',
                    role: 'SuperAdmin',
                    schoolName: 'Main School'
                },
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'Regular Admin',
                    email: 'regular@example.com',
                    role: 'Admin',
                    schoolName: 'Branch School'
                }
            ];

            Admin.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(admins)
            });

            await getAllAdmins(req, res);

            expect(res.json).toHaveBeenCalledWith(admins);
        });

        it('should maintain admin data integrity', async () => {
            const adminId = new mongoose.Types.ObjectId();
            const admins = [
                {
                    _id: adminId,
                    name: 'Test Admin',
                    email: 'test@example.com',
                    role: 'Admin',
                    schoolName: 'Test School',
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ];

            Admin.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(admins)
            });

            await getAllAdmins(req, res);

            const returnedAdmins = res.json.mock.calls[0][0];
            expect(returnedAdmins[0]._id).toEqual(adminId);
            expect(returnedAdmins[0].name).toBe('Test Admin');
        });

        it('should handle very large number of admins', async () => {
            const admins = Array.from({ length: 1000 }, (_, i) => ({
                _id: new mongoose.Types.ObjectId(),
                name: `Admin ${i}`,
                email: `admin${i}@example.com`,
                role: 'Admin',
                schoolName: `School ${i}`
            }));

            Admin.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(admins)
            });

            await getAllAdmins(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json.mock.calls[0][0]).toHaveLength(1000);
        });

        it('should not include password in response', async () => {
            const admins = [
                {
                    _id: new mongoose.Types.ObjectId(),
                    name: 'Admin',
                    email: 'admin@example.com',
                    role: 'Admin'
                }
            ];

            Admin.find.mockReturnValue({
                select: jest.fn().mockResolvedValue(admins)
            });

            await getAllAdmins(req, res);

            const returnedAdmins = res.json.mock.calls[0][0];
            returnedAdmins.forEach(admin => {
                expect(admin.password).toBeUndefined();
            });
        });
    });

    // ==================== GET DASHBOARD TESTS ====================

    describe('getDashboard', () => {
        it('should successfully retrieve dashboard statistics', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            const admin = {
                _id: adminId,
                name: 'Dashboard Admin',
                email: 'dashboard@example.com'
            };

            Admin.findById.mockResolvedValue(admin);
            Student.countDocuments.mockResolvedValue(100);
            Teacher.countDocuments.mockResolvedValue(20);
            Sclass.countDocuments.mockResolvedValue(10);
            Subject.countDocuments.mockResolvedValue(15);

            await getDashboard(req, res);

            expect(Admin.findById).toHaveBeenCalledWith(adminId);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                students: 100,
                teachers: 20,
                classes: 10,
                subjects: 15
            });
        });

        it('should return 404 when admin does not exist', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue(null);

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Admin not found'
            });
        });

        it('should count students for specific admin school', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue({ _id: adminId });
            Student.countDocuments.mockResolvedValue(50);
            Teacher.countDocuments.mockResolvedValue(0);
            Sclass.countDocuments.mockResolvedValue(0);
            Subject.countDocuments.mockResolvedValue(0);

            await getDashboard(req, res);

            expect(Student.countDocuments).toHaveBeenCalledWith({ school: adminId });
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ students: 50 })
            );
        });

        it('should count teachers for specific admin school', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue({ _id: adminId });
            Student.countDocuments.mockResolvedValue(0);
            Teacher.countDocuments.mockResolvedValue(30);
            Sclass.countDocuments.mockResolvedValue(0);
            Subject.countDocuments.mockResolvedValue(0);

            await getDashboard(req, res);

            expect(Teacher.countDocuments).toHaveBeenCalledWith({ school: adminId });
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ teachers: 30 })
            );
        });

        it('should count classes for specific admin school', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue({ _id: adminId });
            Student.countDocuments.mockResolvedValue(0);
            Teacher.countDocuments.mockResolvedValue(0);
            Sclass.countDocuments.mockResolvedValue(12);
            Subject.countDocuments.mockResolvedValue(0);

            await getDashboard(req, res);

            expect(Sclass.countDocuments).toHaveBeenCalledWith({ school: adminId });
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ classes: 12 })
            );
        });

        it('should count subjects for specific admin school', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue({ _id: adminId });
            Student.countDocuments.mockResolvedValue(0);
            Teacher.countDocuments.mockResolvedValue(0);
            Sclass.countDocuments.mockResolvedValue(0);
            Subject.countDocuments.mockResolvedValue(25);

            await getDashboard(req, res);

            expect(Subject.countDocuments).toHaveBeenCalledWith({ school: adminId });
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({ subjects: 25 })
            );
        });

        it('should handle school with no data (all zeros)', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue({ _id: adminId });
            Student.countDocuments.mockResolvedValue(0);
            Teacher.countDocuments.mockResolvedValue(0);
            Sclass.countDocuments.mockResolvedValue(0);
            Subject.countDocuments.mockResolvedValue(0);

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                students: 0,
                teachers: 0,
                classes: 0,
                subjects: 0
            });
        });

        it('should handle large numbers of entities', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue({ _id: adminId });
            Student.countDocuments.mockResolvedValue(10000);
            Teacher.countDocuments.mockResolvedValue(500);
            Sclass.countDocuments.mockResolvedValue(100);
            Subject.countDocuments.mockResolvedValue(200);

            await getDashboard(req, res);

            expect(res.json).toHaveBeenCalledWith({
                students: 10000,
                teachers: 500,
                classes: 100,
                subjects: 200
            });
        });

        it('should handle database errors during admin lookup', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockImplementation(() => {
                throw new Error('Database connection error');
            });

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: expect.any(String)
                })
            );
        });

        it('should handle errors during student count', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue({ _id: adminId });
            Student.countDocuments.mockImplementation(() => {
                throw new Error('Failed to count students');
            });

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('should handle errors during teacher count', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue({ _id: adminId });
            Student.countDocuments.mockResolvedValue(0);
            Teacher.countDocuments.mockImplementation(() => {
                throw new Error('Failed to count teachers');
            });

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('should handle errors during class count', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue({ _id: adminId });
            Student.countDocuments.mockResolvedValue(0);
            Teacher.countDocuments.mockResolvedValue(0);
            Sclass.countDocuments.mockImplementation(() => {
                throw new Error('Failed to count classes');
            });

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('should handle errors during subject count', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue({ _id: adminId });
            Student.countDocuments.mockResolvedValue(0);
            Teacher.countDocuments.mockResolvedValue(0);
            Sclass.countDocuments.mockResolvedValue(0);
            Subject.countDocuments.mockImplementation(() => {
                throw new Error('Failed to count subjects');
            });

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('should return proper error message on database error', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockImplementation(() => {
                throw new Error('Connection timeout');
            });

            await getDashboard(req, res);

            expect(res.json).toHaveBeenCalledWith({
                message: 'Connection timeout'
            });
        });

        it('should handle invalid ObjectId format', async () => {
            req.params.id = 'invalid-id';

            Admin.findById.mockImplementation(() => {
                throw new Error('Cast to ObjectId failed');
            });

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        it('should return all four statistics fields', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue({ _id: adminId });
            Student.countDocuments.mockResolvedValue(75);
            Teacher.countDocuments.mockResolvedValue(15);
            Sclass.countDocuments.mockResolvedValue(8);
            Subject.countDocuments.mockResolvedValue(12);

            await getDashboard(req, res);

            const response = res.json.mock.calls[0][0];
            expect(response).toHaveProperty('students');
            expect(response).toHaveProperty('teachers');
            expect(response).toHaveProperty('classes');
            expect(response).toHaveProperty('subjects');
        });

        it('should use correct admin ID for all count queries', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue({ _id: adminId });
            Student.countDocuments.mockResolvedValue(0);
            Teacher.countDocuments.mockResolvedValue(0);
            Sclass.countDocuments.mockResolvedValue(0);
            Subject.countDocuments.mockResolvedValue(0);

            await getDashboard(req, res);

            expect(Student.countDocuments).toHaveBeenCalledWith({ school: adminId });
            expect(Teacher.countDocuments).toHaveBeenCalledWith({ school: adminId });
            expect(Sclass.countDocuments).toHaveBeenCalledWith({ school: adminId });
            expect(Subject.countDocuments).toHaveBeenCalledWith({ school: adminId });
        });

        it('should handle different admin IDs correctly', async () => {
            const adminId1 = new mongoose.Types.ObjectId();
            const adminId2 = new mongoose.Types.ObjectId();

            // First request
            req.params.id = adminId1;
            Admin.findById.mockResolvedValueOnce({ _id: adminId1 });
            Student.countDocuments.mockResolvedValue(50);
            Teacher.countDocuments.mockResolvedValue(10);
            Sclass.countDocuments.mockResolvedValue(5);
            Subject.countDocuments.mockResolvedValue(8);

            await getDashboard(req, res);

            expect(Student.countDocuments).toHaveBeenCalledWith({ school: adminId1 });

            // Second request
            jest.clearAllMocks();
            req.params.id = adminId2;
            Admin.findById.mockResolvedValueOnce({ _id: adminId2 });
            Student.countDocuments.mockResolvedValue(100);
            Teacher.countDocuments.mockResolvedValue(20);
            Sclass.countDocuments.mockResolvedValue(10);
            Subject.countDocuments.mockResolvedValue(15);

            await getDashboard(req, res);

            expect(Student.countDocuments).toHaveBeenCalledWith({ school: adminId2 });
        });

        it('should verify admin exists before counting entities', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue(null);

            await getDashboard(req, res);

            expect(Student.countDocuments).not.toHaveBeenCalled();
            expect(Teacher.countDocuments).not.toHaveBeenCalled();
            expect(Sclass.countDocuments).not.toHaveBeenCalled();
            expect(Subject.countDocuments).not.toHaveBeenCalled();
        });

        it('should return statistics with correct property names', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue({ _id: adminId });
            Student.countDocuments.mockResolvedValue(1);
            Teacher.countDocuments.mockResolvedValue(2);
            Sclass.countDocuments.mockResolvedValue(3);
            Subject.countDocuments.mockResolvedValue(4);

            await getDashboard(req, res);

            const response = res.json.mock.calls[0][0];
            expect(Object.keys(response)).toEqual(['students', 'teachers', 'classes', 'subjects']);
        });

        it('should handle concurrent dashboard requests', async () => {
            const adminId1 = new mongoose.Types.ObjectId();
            const adminId2 = new mongoose.Types.ObjectId();

            // First request
            req.params.id = adminId1;
            Admin.findById.mockResolvedValueOnce({ _id: adminId1 });
            Student.countDocuments.mockResolvedValue(50);
            Teacher.countDocuments.mockResolvedValue(10);
            Sclass.countDocuments.mockResolvedValue(5);
            Subject.countDocuments.mockResolvedValue(8);

            await getDashboard(req, res);

            expect(res.status).toHaveBeenCalledWith(200);

            // Reset for second request
            res.status.mockClear();
            res.json.mockClear();

            // Second concurrent request
            const req2 = { params: { id: adminId2 } };
            const res2 = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            };

            Admin.findById.mockResolvedValueOnce({ _id: adminId2 });
            Student.countDocuments.mockResolvedValue(100);
            Teacher.countDocuments.mockResolvedValue(20);
            Sclass.countDocuments.mockResolvedValue(10);
            Subject.countDocuments.mockResolvedValue(15);

            await getDashboard(req2, res2);

            expect(res2.status).toHaveBeenCalledWith(200);
        });

        it('should return numeric values for all counts', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue({ _id: adminId });
            Student.countDocuments.mockResolvedValue(45);
            Teacher.countDocuments.mockResolvedValue(12);
            Sclass.countDocuments.mockResolvedValue(7);
            Subject.countDocuments.mockResolvedValue(18);

            await getDashboard(req, res);

            const response = res.json.mock.calls[0][0];
            expect(typeof response.students).toBe('number');
            expect(typeof response.teachers).toBe('number');
            expect(typeof response.classes).toBe('number');
            expect(typeof response.subjects).toBe('number');
        });

        it('should handle partial school data (some entities zero)', async () => {
            const adminId = new mongoose.Types.ObjectId();
            req.params.id = adminId;

            Admin.findById.mockResolvedValue({ _id: adminId });
            Student.countDocuments.mockResolvedValue(100);
            Teacher.countDocuments.mockResolvedValue(0);
            Sclass.countDocuments.mockResolvedValue(5);
            Subject.countDocuments.mockResolvedValue(0);

            await getDashboard(req, res);

            expect(res.json).toHaveBeenCalledWith({
                students: 100,
                teachers: 0,
                classes: 5,
                subjects: 0
            });
        });
    });
});
