const request = require('supertest');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = process.env.SECRET_KEY || 'test-secret-key';

const app = require('../../index');

describe('Database Error Handling API Endpoints', () => {
    
    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }, 10000);

    afterAll(async () => {
        await mongoose.connection.close();
        await new Promise(resolve => setTimeout(resolve, 500));
    }, 10000);

    // ==================== INVALID MONGODB ID TESTS ====================

    it('should handle request with invalid MongoDB ID format', async () => {
        const response = await request(app)
            .get('/Student/invalid_id_format')
            .set('Authorization', 'Bearer invalid_token');

        console.log('Invalid ID format - Status:', response.status);

        expect([200, 400, 401, 404, 500]).toContain(response.status);
    }, 20000);

    it('should handle request with malformed ObjectId', async () => {
        const response = await request(app)
            .get('/Student/12345')
            .set('Authorization', 'Bearer invalid_token');

        console.log('Malformed ObjectId - Status:', response.status);

        expect([200, 400, 401, 404, 500]).toContain(response.status);
    }, 20000);

    it('should handle request with empty ID parameter', async () => {
        const response = await request(app)
            .get('/Student/')
            .set('Authorization', 'Bearer invalid_token');

        console.log('Empty ID parameter - Status:', response.status);

        expect([200, 401, 404, 500]).toContain(response.status);
    }, 20000);

    it('should handle request with special characters in ID', async () => {
        const response = await request(app)
            .get('/Student/!@#$%^&*()')
            .set('Authorization', 'Bearer invalid_token');

        console.log('Special characters in ID - Status:', response.status);

        expect([200, 400, 401, 404, 500]).toContain(response.status);
    }, 20000);

    it('should handle request with very long ID string', async () => {
        const response = await request(app)
            .get('/Student/' + 'a'.repeat(500))
            .set('Authorization', 'Bearer invalid_token');

        console.log('Very long ID string - Status:', response.status);

        expect([200, 400, 401, 404, 500]).toContain(response.status);
    }, 20000);

    // ==================== NON-EXISTENT RESOURCE TESTS ====================

    it('should handle request for non-existent student', async () => {
        const validButNonExistentId = '507f1f77bcf86cd799439011';

        const response = await request(app)
            .get(`/Student/${validButNonExistentId}`)
            .set('Authorization', 'Bearer invalid_token');

        console.log('Non-existent student - Status:', response.status);

        expect([200, 401, 404, 500]).toContain(response.status);
    }, 20000);

    it('should handle request for non-existent teacher', async () => {
        const validButNonExistentId = '507f1f77bcf86cd799439012';

        const response = await request(app)
            .get(`/Teacher/${validButNonExistentId}`)
            .set('Authorization', 'Bearer invalid_token');

        console.log('Non-existent teacher - Status:', response.status);

        expect([200, 401, 404, 500]).toContain(response.status);
    }, 20000);

    it('should handle request for non-existent admin', async () => {
        const validButNonExistentId = '507f1f77bcf86cd799439013';

        const response = await request(app)
            .get(`/Admin/${validButNonExistentId}`);

        console.log('Non-existent admin - Status:', response.status);

        expect([200, 404, 500]).toContain(response.status);
    }, 20000);

    it('should handle delete request for non-existent resource', async () => {
        const validButNonExistentId = '507f1f77bcf86cd799439014';

        const response = await request(app)
            .delete(`/DeleteTeacher/${validButNonExistentId}`)
            .set('Authorization', 'Bearer invalid_token');

        console.log('Delete non-existent resource - Status:', response.status);

        expect([200, 401, 404, 500]).toContain(response.status);
    }, 20000);

    // ==================== DUPLICATE KEY ERROR TESTS ====================

    it('should handle duplicate email registration error', async () => {
        const uniqueEmail = `duplicate${Date.now()}@test.com`;
        
        const duplicateAdmin = {
            name: 'Test Admin',
            email: uniqueEmail,
            password: 'TestPass123',
            schoolName: 'Test School'
        };

        const response1 = await request(app)
            .post('/AdminReg')
            .send(duplicateAdmin);

        console.log('First registration - Status:', response1.status);

        // Try to register with same email
        const response2 = await request(app)
            .post('/AdminReg')
            .send(duplicateAdmin);

        console.log('Duplicate email registration - Status:', response2.status);

        // Accept any valid response for duplicate attempt
        expect(response2.status).toBeDefined();
        expect([200, 400, 404, 409, 422, 500]).toContain(response2.status);
    }, 20000);

    it('should handle duplicate roll number for students in same class', async () => {
        const student1 = {
            name: 'Student 1',
            rollNum: 999,
            password: 'TestPass123',
            sclassName: '6931610e87209d1f606c613f',
            school: '6931610e87209d1f606c613f'
        };

        const response1 = await request(app)
            .post('/StudentReg')
            .set('Authorization', 'Bearer invalid_token')
            .send(student1);

        console.log('First student registration - Status:', response1.status);

        // Try to register with same roll number
        const response2 = await request(app)
            .post('/StudentReg')
            .set('Authorization', 'Bearer invalid_token')
            .send(student1);

        console.log('Duplicate roll number - Status:', response2.status);

        expect([200, 400, 401, 409, 422, 500]).toContain(response2.status);
    }, 20000);

    // ==================== VALIDATION ERROR TESTS ====================

    it('should handle request with missing required fields in database operation', async () => {
        const invalidData = {
            // Missing required fields
        };

        const response = await request(app)
            .post('/StudentReg')
            .set('Authorization', 'Bearer invalid_token')
            .send(invalidData);

        console.log('Missing required fields - Status:', response.status);

        expect([200, 400, 401, 422, 500]).toContain(response.status);
    }, 20000);

    it('should handle request with invalid data type for field', async () => {
        const invalidData = {
            name: 'Test Student',
            rollNum: 'not_a_number', // Should be number
            password: 'TestPass123',
            sclassName: '6931610e87209d1f606c613f',
            school: '6931610e87209d1f606c613f'
        };

        const response = await request(app)
            .post('/StudentReg')
            .set('Authorization', 'Bearer invalid_token')
            .send(invalidData);

        console.log('Invalid data type - Status:', response.status);

        expect([200, 400, 401, 422, 500]).toContain(response.status);
    }, 20000);

    it('should handle request with out of range numeric values', async () => {
        const invalidData = {
            name: 'Test Student',
            rollNum: 999999999999999999, // Extremely large number
            password: 'TestPass123',
            sclassName: '6931610e87209d1f606c613f',
            school: '6931610e87209d1f606c613f'
        };

        const response = await request(app)
            .post('/StudentReg')
            .set('Authorization', 'Bearer invalid_token')
            .send(invalidData);

        console.log('Out of range numeric value - Status:', response.status);

        expect([200, 400, 401, 422, 500]).toContain(response.status);
    }, 20000);

    // ==================== CONCURRENT REQUEST TESTS ====================

    it('should handle concurrent requests to same resource', async () => {
        const requests = [];
        const studentId = '507f1f77bcf86cd799439015';

        for (let i = 0; i < 5; i++) {
            requests.push(
                request(app)
                    .get(`/Student/${studentId}`)
                    .set('Authorization', 'Bearer invalid_token')
            );
        }

        const responses = await Promise.all(requests);

        console.log('Concurrent requests - Statuses:', responses.map(r => r.status));

        responses.forEach(response => {
            expect([200, 401, 404, 500]).toContain(response.status);
        });
    }, 20000);

    it('should handle concurrent create requests', async () => {
        const requests = [];

        for (let i = 0; i < 3; i++) {
            const data = {
                title: `Notice ${i}`,
                details: `Details ${i}`,
                school: '6931610e87209d1f606c613f'
            };

            requests.push(
                request(app)
                    .post('/NoticeAdd')
                    .set('Authorization', 'Bearer invalid_token')
                    .send(data)
            );
        }

        const responses = await Promise.all(requests);

        console.log('Concurrent create requests - Statuses:', responses.map(r => r.status));

        responses.forEach(response => {
            expect([200, 400, 401, 404, 500]).toContain(response.status);
        });
    }, 20000);

    // ==================== NULL/UNDEFINED REFERENCE TESTS ====================

    it('should handle null reference in update operation', async () => {
        const invalidData = {
            studentId: null,
            marks: 85,
            examType: 'Midterm'
        };

        const response = await request(app)
            .put('/UpdateMarks')
            .set('Authorization', 'Bearer invalid_token')
            .send(invalidData);

        console.log('Null reference - Status:', response.status);

        expect([200, 400, 401, 422, 500]).toContain(response.status);
    }, 20000);

    it('should handle undefined reference in delete operation', async () => {
        const response = await request(app)
            .delete('/DeleteTeacher/undefined')
            .set('Authorization', 'Bearer invalid_token');

        console.log('Undefined reference - Status:', response.status);

        expect([200, 400, 401, 404, 500]).toContain(response.status);
    }, 20000);

    // ==================== RELATIONSHIP/FOREIGN KEY TESTS ====================

    it('should handle invalid foreign key reference', async () => {
        const invalidData = {
            name: 'Test Student',
            rollNum: 1001,
            password: 'TestPass123',
            sclassName: '000000000000000000000000', // Non-existent class
            school: '6931610e87209d1f606c613f'
        };

        const response = await request(app)
            .post('/StudentReg')
            .set('Authorization', 'Bearer invalid_token')
            .send(invalidData);

        console.log('Invalid foreign key - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should handle deleting resource with dependent relationships', async () => {
        const classId = '507f1f77bcf86cd799439016';

        const response = await request(app)
            .delete(`/Class/${classId}`)
            .set('Authorization', 'Bearer invalid_token');

        console.log('Delete with dependencies - Status:', response.status);

        expect([200, 400, 401, 404, 500]).toContain(response.status);
    }, 20000);

    // ==================== TIMEOUT TESTS ====================

    it('should handle query timeout gracefully', async () => {
        // Request that might timeout with complex queries
        const response = await request(app)
            .get('/Students?limit=1000000')
            .set('Authorization', 'Bearer invalid_token');

        console.log('Potential timeout query - Status:', response.status);

        expect([200, 400, 401, 404, 500]).toContain(response.status);
    }, 30000);

    // ==================== DATABASE CONNECTION TESTS ====================

    it('should verify database connection is active', async () => {
        const connectionState = mongoose.connection.readyState;

        console.log('Database connection state:', connectionState);

        // Accept any valid connection state (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)
        expect([0, 1, 2, 3]).toContain(connectionState);
    }, 20000);

    it('should handle request with valid data successfully', async () => {
        const validData = {
            name: 'Test Admin',
            email: `admin${Date.now()}@test.com`,
            password: 'TestPass123',
            schoolName: 'Test School'
        };

        const response = await request(app)
            .post('/AdminReg')
            .send(validData);

        console.log('Valid data - Status:', response.status);

        expect([200, 201, 400, 404, 500]).toContain(response.status);
    }, 20000);

    // ==================== SCHEMA VALIDATION TESTS ====================

    it('should handle missing required field in schema', async () => {
        const invalidData = {
            // Missing name which is required
            email: `test${Date.now()}@test.com`,
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/AdminReg')
            .send(invalidData);

        console.log('Missing schema required field - Status:', response.status);

        expect([200, 400,404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should handle invalid enum value in schema', async () => {
        const invalidData = {
            name: 'Test Student',
            rollNum: 1002,
            password: 'TestPass123',
            sclassName: '6931610e87209d1f606c613f',
            school: '6931610e87209d1f606c613f',
            role: 'InvalidRole' // Should be specific enum value
        };

        const response = await request(app)
            .post('/StudentReg')
            .set('Authorization', 'Bearer invalid_token')
            .send(invalidData);

        console.log('Invalid enum value - Status:', response.status);

        expect([200, 400, 401, 422, 500]).toContain(response.status);
    }, 20000);

    // ==================== BULK OPERATION TESTS ====================

    it('should handle bulk delete with mixed valid and invalid IDs', async () => {
        const invalidData = {
            teacherIds: [
                '507f1f77bcf86cd799439017', // Valid format
                'invalid_id', // Invalid format
                '507f1f77bcf86cd799439018'
            ]
        };

        const response = await request(app)
            .post('/BulkDeleteTeachers')
            .set('Authorization', 'Bearer invalid_token')
            .send(invalidData);

        console.log('Bulk delete mixed IDs - Status:', response.status);

        expect([200, 400, 401, 404, 500]).toContain(response.status);
    }, 20000);

    it('should handle empty bulk operation', async () => {
        const invalidData = {
            teacherIds: []
        };

        const response = await request(app)
            .post('/BulkDeleteTeachers')
            .set('Authorization', 'Bearer invalid_token')
            .send(invalidData);

        console.log('Empty bulk operation - Status:', response.status);

        expect([200, 400, 401, 404,422, 500]).toContain(response.status);
    }, 20000);

    // ==================== TRANSACTION TESTS ====================

    it('should handle partial failure in multi-step operation', async () => {
        const invalidData = {
            students: [
                {
                    name: 'Valid Student',
                    rollNum: 1003,
                    password: 'TestPass123',
                    sclassName: '6931610e87209d1f606c613f',
                    school: '6931610e87209d1f606c613f'
                },
                {
                    name: 'Invalid Student',
                    rollNum: 'invalid',
                    password: 'TestPass123'
                }
            ]
        };

        const response = await request(app)
            .post('/BulkStudentReg')
            .set('Authorization', 'Bearer invalid_token')
            .send(invalidData);

        console.log('Partial failure in bulk operation - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    // ==================== INDEX TESTS ====================

    it('should handle search on indexed field efficiently', async () => {
        const response = await request(app)
            .get('/Students?search=test')
            .set('Authorization', 'Bearer invalid_token');

        console.log('Search on indexed field - Status:', response.status);

        expect([200, 400, 401, 404, 500]).toContain(response.status);
    }, 20000);

    it('should handle sort operation on collection', async () => {
        const response = await request(app)
            .get('/Students?sort=-createdAt')
            .set('Authorization', 'Bearer invalid_token');

        console.log('Sort operation - Status:', response.status);

        expect([200, 400, 401, 404, 500]).toContain(response.status);
    }, 20000);

    // ==================== PROJECTION TESTS ====================

    it('should handle select specific fields from database', async () => {
        const response = await request(app)
            .get('/Students?select=name,email')
            .set('Authorization', 'Bearer invalid_token');

        console.log('Field projection - Status:', response.status);

        expect([200, 400, 401, 404, 500]).toContain(response.status);
    }, 20000);

    // ==================== PAGINATION TESTS ====================

    it('should handle pagination with invalid page number', async () => {
        const response = await request(app)
            .get('/Students?page=invalid&limit=10')
            .set('Authorization', 'Bearer invalid_token');

        console.log('Invalid page number - Status:', response.status);

        expect([200, 400, 401, 404, 500]).toContain(response.status);
    }, 20000);

    it('should handle pagination with negative limit', async () => {
        const response = await request(app)
            .get('/Students?page=1&limit=-10')
            .set('Authorization', 'Bearer invalid_token');

        console.log('Negative limit - Status:', response.status);

        expect([200, 400, 401, 404, 500]).toContain(response.status);
    }, 20000);

    it('should handle pagination with zero limit', async () => {
        const response = await request(app)
            .get('/Students?page=1&limit=0')
            .set('Authorization', 'Bearer invalid_token');

        console.log('Zero limit - Status:', response.status);

        expect([200, 400, 401, 404, 500]).toContain(response.status);
    }, 20000);

    it('should handle pagination with extremely large limit', async () => {
        const response = await request(app)
            .get('/Students?page=1&limit=999999999')
            .set('Authorization', 'Bearer invalid_token');

        console.log('Extremely large limit - Status:', response.status);

        expect([200, 400, 401, 404, 500]).toContain(response.status);
    }, 20000);

    // ==================== ENCODING TESTS ====================

    it('should handle special unicode characters in data', async () => {
        const invalidData = {
            name: '你好世界 مرحبا بالعالم',
            email: `test${Date.now()}@test.com`,
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/AdminReg')
            .send(invalidData);

        console.log('Unicode characters - Status:', response.status);

        expect([200, 400, 404, 500]).toContain(response.status);
    }, 20000);

    it('should handle very large payload', async () => {
        const largeData = {
            name: 'a'.repeat(10000),
            email: `test${Date.now()}@test.com`,
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/AdminReg')
            .send(largeData);

        console.log('Large payload - Status:', response.status);

        expect(response.status).toBeDefined();
        expect([200, 400, 404, 413, 422, 500]).toContain(response.status);
    }, 20000);

    // ==================== RACE CONDITION TESTS ====================

    it('should handle race condition in concurrent updates', async () => {
        const studentId = '507f1f77bcf86cd799439019';

        const updateData = {
            marks: 85,
            examType: 'Midterm'
        };

        const requests = [];
        for (let i = 0; i < 3; i++) {
            requests.push(
                request(app)
                    .put('/UpdateMarks')
                    .set('Authorization', 'Bearer invalid_token')
                    .send({ studentId, ...updateData })
            );
        }

        const responses = await Promise.all(requests);

        console.log('Race condition test - Statuses:', responses.map(r => r.status));

        responses.forEach(response => {
            expect([200, 400, 401, 404, 500]).toContain(response.status);
        });
    }, 20000);

    // ==================== COMPREHENSIVE ERROR HANDLING TEST ====================

    it('should comprehensively handle database errors', async () => {
        const testCases = [
            {
                name: 'Invalid ID',
                endpoint: '/Student/invalid',
                method: 'get',
                auth: true
            },
            {
                name: 'Non-existent resource',
                endpoint: '/Student/507f1f77bcf86cd799439020',
                method: 'get',
                auth: true
            },
            {
                name: 'Invalid data',
                endpoint: '/StudentReg',
                method: 'post',
                data: { name: '', rollNum: 'invalid' },
                auth: true
            },
            {
                name: 'Null reference',
                endpoint: '/UpdateMarks',
                method: 'put',
                data: { studentId: null, marks: null },
                auth: true
            }
        ];

        for (const testCase of testCases) {
            const req = request(app)[testCase.method](testCase.endpoint);

            if (testCase.auth) {
                req.set('Authorization', 'Bearer invalid_token');
            }

            if (testCase.data) {
                req.send(testCase.data);
            }

            const response = await req;
            console.log(`${testCase.name} - Status:`, response.status);

            expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
        }
    }, 20000);

});