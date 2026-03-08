const request = require('supertest');
const { app, server } = require('../src/app');
const { clerkClient } = require('../src/config/clerk');
const ioClient = require('socket.io-client');

// Mock Clerk client
jest.mock('../src/config/clerk', () => ({
    clerkClient: {
        verifyToken: jest.fn()
    }
}));

// Silence console noise during tests
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'warn').mockImplementation(() => { });
});

afterAll(() => {
    jest.restoreAllMocks();
});

describe('Server API Tests', () => {
    const port = 5556; // Use a different port for testing

    beforeAll((done) => {
        server.listen(port, done);
    });

    afterAll((done) => {
        server.close(done);
    });

    describe('GET /health', () => {
        it('should return 200 OK with status and timestamp', async () => {
            const response = await request(app).get('/health');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'ok');
            expect(response.body).toHaveProperty('timestamp');
        });
    });

    describe('Socket.io Connection', () => {
        it('should fail connection without token', (done) => {
            const socket = ioClient(`http://localhost:${port}`);

            socket.on('connect_error', (err) => {
                expect(err.message).toBe('Authentication required');
                socket.close();
                done();
            });
        });

        it('should succeed connection with valid token', (done) => {
            clerkClient.verifyToken.mockResolvedValue({ sub: 'user_123', sid: 'session_123' });

            const socket = ioClient(`http://localhost:${port}`, {
                auth: { token: 'valid_token' }
            });

            socket.on('connect', () => {
                expect(socket.connected).toBe(true);
                socket.close();
                done();
            });
        });
    });

    describe('Server and App Initialization', () => {
        it('should have app and server defined', () => {
            expect(app).toBeDefined();
            expect(server).toBeDefined();
        });
    });
});
