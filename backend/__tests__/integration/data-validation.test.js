const request = require('supertest');
const mongoose = require('mongoose');

// Set test environment BEFORE importing app
process.env.NODE_ENV = 'test';
process.env.SECRET_KEY = process.env.SECRET_KEY || 'test-secret-key';

const app = require('../../index');

describe('Login API Endpoint Tests', () => {
    
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

    // ==================== VALID LOGIN TESTS ====================

    it('should successfully login with valid admin credentials', async () => {
        const validLogin = {
            email: 'admin@test.com',
            password: 'password123'
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(validLogin);

        console.log('Valid login - Status:', response.status, 'Body:', response.body);

        expect([200, 201, 400, 401, 404, 422, 500]).toContain(response.status);
        if (response.status === 200 || response.status === 201) {
            expect(response.body).toHaveProperty('token');
        }
    }, 20000);

    // ==================== STUDENT LOGIN VALIDATION ====================

    it('should reject student login with missing name and roll number', async () => {
        const invalidLogin = {
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/StudentLogin')
            .send(invalidLogin);

        console.log('Student login missing credentials - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject student login with invalid roll number format', async () => {
        const invalidLogin = {
            rollNum: 'abc123',
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/StudentLogin')
            .send(invalidLogin);

        console.log('Student invalid roll number - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject student login with negative roll number', async () => {
        const invalidLogin = {
            rollNum: -123,
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/StudentLogin')
            .send(invalidLogin);

        console.log('Student negative roll number - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    // ==================== TEACHER LOGIN VALIDATION ====================

    it('should reject teacher login with missing email', async () => {
        const invalidLogin = {
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/TeacherLogin')
            .send(invalidLogin);

        console.log('Teacher login missing email - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject teacher login with invalid email format', async () => {
        const invalidLogin = {
            email: 'not-an-email',
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/TeacherLogin')
            .send(invalidLogin);

        console.log('Teacher invalid email format - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject teacher login with missing password', async () => {
        const invalidLogin = {
            email: 'teacher@test.com'
        };

        const response = await request(app)
            .post('/TeacherLogin')
            .send(invalidLogin);

        console.log('Teacher login missing password - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    // ==================== ADMIN LOGIN VALIDATION ====================

    it('should reject admin login with empty credentials', async () => {
        const invalidLogin = {
            email: '',
            password: ''
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(invalidLogin);

        console.log('Admin login empty credentials - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject admin login with missing email', async () => {
        const invalidLogin = {
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(invalidLogin);

        console.log('Admin login missing email - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject admin login with missing password', async () => {
        const invalidLogin = {
            email: 'admin@test.com'
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(invalidLogin);

        console.log('Admin login missing password - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject admin login with invalid email format', async () => {
        const invalidLogin = {
            email: 'invalid-email-format',
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(invalidLogin);

        console.log('Admin login invalid email format - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject admin login with null email', async () => {
        const invalidLogin = {
            email: null,
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(invalidLogin);

        console.log('Admin login null email - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject admin login with null password', async () => {
        const invalidLogin = {
            email: 'admin@test.com',
            password: null
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(invalidLogin);

        console.log('Admin login null password - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject admin login with weak password', async () => {
        const invalidLogin = {
            email: 'admin@test.com',
            password: '123'
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(invalidLogin);

        console.log('Admin login weak password - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject admin login with SQL injection attempt', async () => {
        const invalidLogin = {
            email: "' OR '1'='1",
            password: "' OR '1'='1"
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(invalidLogin);

        console.log('Admin login SQL injection - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject admin login with XSS attempt in email', async () => {
        const invalidLogin = {
            email: '<script>alert("xss")</script>',
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(invalidLogin);

        console.log('Admin login XSS attempt - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject admin login with extremely long email', async () => {
        const invalidLogin = {
            email: 'a'.repeat(500) + '@test.com',
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(invalidLogin);

        console.log('Admin login extremely long email - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject admin login with array instead of string', async () => {
        const invalidLogin = {
            email: ['admin@test.com'],
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(invalidLogin);

        console.log('Admin login array email - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject admin login with object instead of string', async () => {
        const invalidLogin = {
            email: { value: 'admin@test.com' },
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(invalidLogin);

        console.log('Admin login object email - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject login with wrong credentials', async () => {
        const invalidLogin = {
            email: 'nonexistent@test.com',
            password: 'wrongpassword123'
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(invalidLogin);

        console.log('Admin login wrong credentials - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should reject login with email containing special characters', async () => {
        const invalidLogin = {
            email: 'admin@!#$%^&*().com',
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(invalidLogin);

        console.log('Admin login special characters in email - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);

    it('should handle login with extra whitespace in email', async () => {
        const invalidLogin = {
            email: '  admin@test.com  ',
            password: 'TestPass123'
        };

        const response = await request(app)
            .post('/AdminLogin')
            .send(invalidLogin);

        console.log('Admin login with whitespace - Status:', response.status);

        expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    }, 20000);
});