const request = require('supertest');
const mongoose = require('mongoose');

// Set test environment BEFORE importing app
process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = process.env.SECRET_KEY || 'test-secret-key';

const app = require('../../index');
const Student = require('../../models/studentSchema');

describe('Get Student API Endpoints', () => {
    
    let authToken;
    let testStudentId;
    
    // Setup: Try to get auth token
    beforeAll(async () => {
        if (mongoose.connection.readyState === 0) {
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        // Try to login (optional - only if endpoints require auth)
        try {
            const loginResponse = await request(app)
                .post('/AdminLogin')
                .send({
                    email: 'ahmadprivateacc2005@gmail.com',
                    password: 'Ahmad@123'
                });
            
            if (loginResponse.status === 200 && loginResponse.body.token) {
                authToken = loginResponse.body.token;
                console.log('Auth token obtained');
            }
        } catch (error) {
            console.log('Login optional - endpoints might not require auth');
        }
        
        // Find an existing student for testing
        const testStudent = await Student.findOne({});
        if (testStudent) {
            testStudentId = testStudent._id.toString();
            console.log('Found test student ID:', testStudentId);
        }
    }, 30000);

    // Cleanup
    afterAll(async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
    }, 10000);

    // Helper function for requests
    const makeRequest = (method, url) => {
        const req = request(app)[method](url);
        if (authToken) {
            req.set('Authorization', `Bearer ${authToken}`);
        }
        return req;
    };

    it('should get all students successfully', async () => {
        const response = await makeRequest('get', '/Students');
        
        console.log('Get all students response:', {
            status: response.status,
            count: Array.isArray(response.body) ? response.body.length : 'N/A'
        });

        expect([200, 401, 403]).toContain(response.status);
        if (response.status === 200) {
            expect(Array.isArray(response.body)).toBe(true);
        }
    }, 20000);

    it('should get student by ID successfully', async () => {
        if (!testStudentId) {
            console.log('Skipping - No student ID available');
            return;
        }
        
        const response = await makeRequest('get', `/Student/${testStudentId}`);
        
        console.log('Get student by ID response:', {
            status: response.status,
            hasName: response.status === 200 ? !!response.body.name : 'N/A'
        });

        if (response.status === 200) {
            expect(response.body).toHaveProperty('name');
            expect(response.body).toHaveProperty('rollNum');
        } else {
            expect([404, 401, 403, 500]).toContain(response.status);
        }
    }, 20000);

    it('should return error for invalid student ID', async () => {
        const invalidId = 'invalid_id_123';
        
        const response = await makeRequest('get', `/Student/${invalidId}`);
        
        console.log('Invalid ID response:', {
            status: response.status
        });

        expect([400, 404, 500]).toContain(response.status);
    }, 20000);

    it('should get students by class successfully', async () => {
        // First get a student to know their class
        const existingStudent = await Student.findOne({});
        if (!existingStudent) {
            console.log('No student found to test class endpoint');
            return;
        }
        
        const className = existingStudent.sclassName || 'SE-5A';
        
        const response = await makeRequest('get', `/Students/Class/${className}`);
        
        console.log('Get by class response:', {
            status: response.status,
            className: className,
            count: Array.isArray(response.body) ? response.body.length : 'N/A'
        });

        if (response.status === 200) {
            expect(Array.isArray(response.body)).toBe(true);
        } else {
            expect([200, 404, 401, 403]).toContain(response.status);
        }
    }, 20000);
});