const express = require('express');
const router = express.Router();

// Safe import with fallback
const safeRequire = (modulePath) => {
    try {
        return require(modulePath);
    } catch (err) {
        console.log(`Failed to load ${modulePath}:`, err.message);
        return {};
    }
};

const adminController = safeRequire('../controllers/admin-controller');
const studentController = safeRequire('../controllers/student_controller');
const teacherController = safeRequire('../controllers/teacher-controller');
const classController = safeRequire('../controllers/class-controller');
const subjectController = safeRequire('../controllers/subject-controller');
const noticeController = safeRequire('../controllers/notice-controller');
const complainController = safeRequire('../controllers/complain-controller');

// Auth middleware
let authMiddleware;
try {
    authMiddleware = require('../middleware/auth');
} catch (err) {
    authMiddleware = (req, res, next) => next();
}

// Helper function to handle missing controllers
const handleRoute = (handler) => {
    return handler || ((req, res) => res.status(404).json({ message: 'Route not available' }));
};

// ==================== ADMIN ROUTES ====================
router.post('/AdminReg', handleRoute(adminController.adminRegister || adminController.addAdmin));
router.post('/AdminLogin', handleRoute(adminController.adminLogIn || adminController.login));
router.get('/Admin/:id', handleRoute(adminController.getAdminDetail));
router.get('/Admins', authMiddleware, handleRoute(adminController.getAllAdmins));
router.put('/Admin/:id', authMiddleware, handleRoute(adminController.updateAdmin));
router.delete('/Admin/:id', authMiddleware, handleRoute(adminController.deleteAdmin));

// ==================== STUDENT ROUTES ====================
router.post('/StudentReg', authMiddleware, handleRoute(studentController.addStudent));
router.get('/Student/:id', authMiddleware, handleRoute(studentController.getStudentDetail));
router.get('/Students', authMiddleware, handleRoute(studentController.getStudents));
router.put('/Student/:id', authMiddleware, handleRoute(studentController.updateStudent));
router.delete('/Student/:id', authMiddleware, handleRoute(studentController.deleteStudent));
router.put('/UpdateMarks', authMiddleware, handleRoute(studentController.updateMarks));
router.get('/StudentMarks/:id', authMiddleware, handleRoute(studentController.getStudentMarks));

// ==================== TEACHER ROUTES ====================
router.post('/TeacherReg', authMiddleware, handleRoute(teacherController.addTeacher || teacherController.addTeachers));
router.get('/Teacher/:id', authMiddleware, handleRoute(teacherController.getTeacherDetail));
router.get('/Teachers', authMiddleware, handleRoute(teacherController.getTeachers));
router.put('/Teacher/:id', authMiddleware, handleRoute(teacherController.updateTeacher));
router.delete('/DeleteTeacher/:id', authMiddleware, handleRoute(teacherController.deleteTeacher));

// ==================== CLASS ROUTES ====================
router.post('/ClassAdd', authMiddleware, handleRoute(classController.addClass || classController.addSclass));
router.get('/Class/:id', authMiddleware, handleRoute(classController.getClassDetail));
router.get('/Classes', authMiddleware, handleRoute(classController.getClasses));
router.put('/Class/:id', authMiddleware, handleRoute(classController.updateClass));
router.delete('/Class/:id', authMiddleware, handleRoute(classController.deleteClass));

// ==================== SUBJECT ROUTES ====================
router.post('/SubjectAdd', authMiddleware, handleRoute(subjectController.addSubject));
router.get('/Subject/:id', authMiddleware, handleRoute(subjectController.getSubjectDetail));
router.get('/Subjects', authMiddleware, handleRoute(subjectController.getSubjects));
router.put('/Subject/:id', authMiddleware, handleRoute(subjectController.updateSubject));
router.delete('/Subject/:id', authMiddleware, handleRoute(subjectController.deleteSubject));

// ==================== ATTENDANCE ROUTES ====================
router.get('/Attendance', authMiddleware, handleRoute(studentController.getAttendance));
router.get('/StudentAttendance/:id', authMiddleware, handleRoute(studentController.getStudentAttendance));
router.get('/ClassAttendance/:id', authMiddleware, handleRoute(studentController.getClassAttendance));
router.get('/AttendanceByDate', authMiddleware, handleRoute(studentController.getAttendanceByDate));

// ==================== NOTICE ROUTES ====================
router.post('/NoticeAdd', authMiddleware, handleRoute(noticeController.addNotice));
router.get('/Notices', authMiddleware, handleRoute(noticeController.getNotices));

// ==================== COMPLAINT ROUTES ====================
router.post('/ComplainAdd', authMiddleware, handleRoute(complainController.addComplain));
router.get('/Complains', authMiddleware, handleRoute(complainController.getComplains));

// ==================== ADMIN DASHBOARD ROUTES ====================
router.get('/AdminDashboard', authMiddleware, handleRoute(adminController.getDashboard));
router.get('/ManageUsers', authMiddleware, handleRoute(adminController.manageUsers));

// Catch all undefined routes
router.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

module.exports = router;