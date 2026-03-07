const { Server } = require('socket.io');
const { verifyClerkToken } = require('../middleware/auth');
const { registerHandlers } = require('./handlers');

let io;

const initSocket = (server, FRONTEND_URL) => {
    io = new Server(server, {
        cors: {
            origin: FRONTEND_URL,
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeout: 120000,
        pingInterval: 30000,
        transports: ['websocket', 'polling']
    });

    // Add Clerk authentication middleware to Socket.IO
    io.use(verifyClerkToken);

    io.on('connection', (socket) => {
        registerHandlers(io, socket);
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = {
    initSocket,
    getIO
};
