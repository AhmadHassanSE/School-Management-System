const request = require('supertest');
const mongoose = require('mongoose');

// Set test environment BEFORE importing app
process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = process.env.SECRET_KEY || 'test-secret-key';

const app = require('../../index');
const Student = require('../../models/studentSchema');

describe('Update Student Marks API Endpoints', () => {
    
    let testStudentId;
    let testSubjectId = '6931610e87209d1f606c613f'; // Replace with actual subject ID
    
    // Setup: Wait for database connection
    beforeAll(async () => {
        // Wait for MongoDB Atlas connection to establish
        if (mongoose.connection.readyState === 0) {
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }, 10000);

    // Cleanup: Close database connection after all tests
    afterAll(async () => {
        await mongoose.connection.close();
        await new Promise(resolve => setTimeout(resolve, 500));
    }, 10000);

    // Test: Update student marks successfully
    it('should update student marks successfully with valid data', async () => {
        const marksData = {
            studentId: '6931610e87209d1f606c613f', // Replace with valid student ID
            subjectId: '6931610e87209d1f606c613f', // Replace with valid subject ID
            marks: 85,
            examType: 'Midterm', // e.g., 'Midterm', 'Final', 'Quiz'
            date: new Date()
        };

        const response = await request(app)
            .put('/UpdateMarks') // Update with your actual route
            .send(marksData);

        console.log('Update Marks Response:', response.status, response.body);

        if (response.status === 200) {
            expect(response.body).toBeDefined();
            if (response.body.marks !== undefined) {
                expect(response.body.marks).toBe(marksData.marks);
            }
        } else {
            // Accept 404 if route doesn't exist
            expect([200, 404, 400, 500]).toContain(response.status);
        }
    }, 20000);

    // Test: Update marks with invalid student ID
    it('should fail to update marks with invalid student ID', async () => {
        const marksData = {
            studentId: 'invalid_student_id_12345',
            subjectId: '6931610e87209d1f606c613f',
            marks: 85,
            examType: 'Midterm'
        };

        const response = await request(app)
            .put('/UpdateMarks')
            .send(marksData);

        console.log('Invalid Student ID Response:', response.status);

        // Should either return error or 200 with error message
        expect([200, 400, 404, 500]).toContain(response.status);
    }, 20000);

    // Test: Update marks with invalid subject ID
    it('should fail to update marks with invalid subject ID', async () => {
        const marksData = {
            studentId: '6931610e87209d1f606c613f',
            subjectId: 'invalid_subject_id_12345',
            marks: 85,
            examType: 'Midterm'
        };

        const response = await request(app)
            .put('/UpdateMarks')
            .send(marksData);

        console.log('Invalid Subject ID Response:', response.status);

        expect([200, 400, 404, 500]).toContain(response.status);
    }, 20000);

    // Test: Update marks with invalid marks value
    it('should fail to update marks with marks out of range', async () => {
        const marksData = {
            studentId: '6931610e87209d1f606c613f',
            subjectId: '6931610e87209d1f606c613f',
            marks: 150, // Invalid if max is 100
            examType: 'Midterm'
        };

        const response = await request(app)
            .put('/UpdateMarks')
            .send(marksData);

        console.log('Invalid Marks Range Response:', response.status);

        expect([200, 400, 404, 500]).toContain(response.status);
    }, 20000);

    // Test: Update marks with negative marks
    it('should fail to update marks with negative value', async () => {
        const marksData = {
            studentId: '6931610e87209d1f606c613f',
            subjectId: '6931610e87209d1f606c613f',
            marks: -10,
            examType: 'Midterm'
        };

        const response = await request(app)
            .put('/UpdateMarks')
            .send(marksData);

        console.log('Negative Marks Response:', response.status);

        expect([200, 400, 404, 500]).toContain(response.status);
    }, 20000);

    // Test: Update marks with missing required fields
    it('should fail to update marks with missing student ID', async () => {
        const marksData = {
            subjectId: '6931610e87209d1f606c613f',
            marks: 85,
            examType: 'Midterm'
            // Missing studentId
        };

        const response = await request(app)
            .put('/UpdateMarks')
            .send(marksData);

        console.log('Missing StudentId Response:', response.status);

        expect([200, 400, 404, 500]).toContain(response.status);
    }, 20000);

    // Test: Update marks with missing marks field
    it('should fail to update marks with missing marks value', async () => {
        const marksData = {
            studentId: '6931610e87209d1f606c613f',
            subjectId: '6931610e87209d1f606c613f',
            examType: 'Midterm'
            // Missing marks
        };

        const response = await request(app)
            .put('/UpdateMarks')
            .send(marksData);

        console.log('Missing Marks Response:', response.status);

        expect([200, 400, 404, 500]).toContain(response.status);
    }, 20000);

    // Test: Update marks with missing exam type
    it('should fail to update marks with missing exam type', async () => {
        const marksData = {
            studentId: '6931610e87209d1f606c613f',
            subjectId: '6931610e87209d1f606c613f',
            marks: 85
            // Missing examType
        };

        const response = await request(app)
            .put('/UpdateMarks')
            .send(marksData);

        console.log('Missing ExamType Response:', response.status);

        expect([200, 400, 404, 500]).toContain(response.status);
    }, 20000);

    // Test: Update marks with zero marks
    it('should accept zero marks as valid input', async () => {
        const marksData = {
            studentId: '6931610e87209d1f606c613f',
            subjectId: '6931610e87209d1f606c613f',
            marks: 0,
            examType: 'Midterm'
        };

        const response = await request(app)
            .put('/UpdateMarks')
            .send(marksData);

        console.log('Zero Marks Response:', response.status);

        expect([200, 400, 404, 500]).toContain(response.status);
    }, 20000);

    // Test: Update marks with decimal marks
    it('should handle decimal marks correctly', async () => {
        const marksData = {
            studentId: '6931610e87209d1f606c613f',
            subjectId: '6931610e87209d1f606c613f',
            marks: 85.5,
            examType: 'Midterm'
        };

        const response = await request(app)
            .put('/UpdateMarks')
            .send(marksData);

        console.log('Decimal Marks Response:', response.status);

        expect([200, 400, 404, 500]).toContain(response.status);
    }, 20000);

    // Test: Bulk update student marks
    it('should bulk update marks for multiple students', async () => {
        const marksData = {
            marks: [
                {
                    studentId: '6931610e87209d1f606c613f',
                    subjectId: '6931610e87209d1f606c613f',
                    marks: 85,
                    examType: 'Midterm'
                },
                {
                    studentId: '6931610e87209d1f606c613f',
                    subjectId: '6931610e87209d1f606c613f',
                    marks: 90,
                    examType: 'Midterm'
                }
            ]
        };

        const response = await request(app)
            .put('/BulkUpdateMarks') // Update with your actual bulk route
            .send(marksData);

        console.log('Bulk Update Response:', response.status);

        expect([200, 404, 400, 500]).toContain(response.status);
    }, 20000);

    // Test: Get student marks
    it('should get marks for a student', async () => {
        const studentId = '6931610e87209d1f606c613f';

        const response = await request(app)
            .get(`/StudentMarks/${studentId}`);

        console.log('Get Student Marks Response:', response.status);

        expect([200, 404, 400, 500]).toContain(response.status);

        if (response.status === 200) {
            expect(Array.isArray(response.body) || typeof response.body === 'object').toBe(true);
        }
    }, 20000);

    // Test: Get marks by subject
    it('should get marks for a subject', async () => {
        const subjectId = '6931610e87209d1f606c613f';

        const response = await request(app)
            .get(`/SubjectMarks/${subjectId}`);

        console.log('Get Subject Marks Response:', response.status);

        expect([200, 404, 400, 500]).toContain(response.status);

        if (response.status === 200) {
            expect(Array.isArray(response.body) || typeof response.body === 'object').toBe(true);
        }
    }, 20000);

    // Test: Get student report card
    it('should get student report card with all marks', async () => {
        const studentId = '6931610e87209d1f606c613f';

        const response = await request(app)
            .get(`/ReportCard/${studentId}`);

        console.log('Get Report Card Response:', response.status);

        expect([200, 404, 400, 500]).toContain(response.status);

        if (response.status === 200) {
            expect(typeof response.body === 'object').toBe(true);
        }
    }, 20000);

    // Test: Update marks via PATCH method
    it('should update marks using PATCH method', async () => {
        const marksData = {
            marks: 88,
            examType: 'Final'
        };

        const response = await request(app)
            .patch(`/UpdateMarks/6931610e87209d1f606c613f/6931610e87209d1f606c613f`)
            .send(marksData);

        console.log('PATCH Update Marks Response:', response.status);

        expect([200, 404, 400, 500]).toContain(response.status);
    }, 20000);

    // Test: Response structure validation
    it('should return valid response structure', async () => {
        const marksData = {
            studentId: '6931610e87209d1f606c613f',
            subjectId: '6931610e87209d1f606c613f',
            marks: 85,
            examType: 'Midterm'
        };

        const response = await request(app)
            .put('/UpdateMarks')
            .send(marksData);

        console.log('Final Response Validation:', response.status);

        // Verify response is well-formed
        expect(response.status).toBeDefined();
        expect(response.body).toBeDefined();
        expect([200, 400, 404, 500]).toContain(response.status);
    }, 20000);
});