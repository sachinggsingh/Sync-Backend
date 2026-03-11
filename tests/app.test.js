const request = require('supertest');
const { app, server } = require('../src/app');
const ioClient = require('socket.io-client');


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
        it('should connect without authentication and allow join', (done) => {
            const socket = ioClient(`http://localhost:${port}`);

            socket.on('connect', () => {
                socket.emit('join', { roomId: 'room1', username: 'bob' });
            });

            socket.on('user-joined', (data) => {
                expect(data).toHaveProperty('clients');
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
