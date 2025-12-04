const request = require('supertest');
const mongoose = require('mongoose');

// Set test environment BEFORE importing app
process.env.NODE_ENV = 'test';
// Use the actual MongoDB Atlas URL from .env (don't override with localhost)
// process.env.MONGO_URL is already set from .env file
process.env.SECRET_KEY = process.env.SECRET_KEY || 'test-secret-key';

const app = require('../../index');

describe('Login API Endpoint', () => {
    
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

    it('should login successfully with valid admin credentials', async () => {
        const response = await request(app)
            .post('/AdminLogin')
            .send({ 
                email: 'ahmadprivateacc2005@gmail.com', 
                password: 'Ahmad@123' 
            });
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('email', 'ahmadprivateacc2005@gmail.com');
        expect(response.body).toHaveProperty('name');
        expect(response.body).toHaveProperty('role', 'Admin');
        expect(response.body).toHaveProperty('schoolName');
    }, 20000);

    it('should fail to login with invalid email', async () => {
        const response = await request(app)
            .post('/AdminLogin')
            .send({ 
                email: 'nonexistent@test.com', 
                password: 'Ahmad@123' 
            });
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
    }, 20000);

    it('should return error for missing email', async () => {
        const response = await request(app)
            .post('/AdminLogin')
            .send({ password: 'Ahmad@123' });
        
        // API returns 200 with error message
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Email and password are required');
    }, 20000);

    it('should return error for missing password', async () => {
        const response = await request(app)
            .post('/AdminLogin')
            .send({ email: 'ahmadprivateacc2005@gmail.com' });
        
        // API returns 200 with error message
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Email and password are required');
    }, 20000);

    it('should return error for incorrect password', async () => {
        const response = await request(app)
            .post('/AdminLogin')
            .send({ 
                email: 'ahmadprivateacc2005@gmail.com', 
                password: 'WrongPassword123' 
            });
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
    }, 20000);
});