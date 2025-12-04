const request = require('supertest');
const app = require('../../app'); 

describe('Login API Endpoint', () => {
    it('should login successfully with correct credentials', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({ username: 'testuser', password: 'testpass' });
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
    });

    it('should fail login with incorrect credentials', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({ username: 'testuser', password: 'wrongpass' });
        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should return error for missing username', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({ password: 'testpass' });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Username is required');
    });

    it('should return error for missing password', async () => {
        const response = await request(app)
            .post('/api/login')
            .send({ username: 'testuser' });
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', 'Password is required');
    });
});