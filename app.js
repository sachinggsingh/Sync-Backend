const express = require('express');
const app = express();
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { validateRoomId, validateUsername, validateMessage, validateCode } = require('./middleware/validator');
const { verifyClerkToken } = require('./middleware/clerkAuth');


const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 5555;


// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow Socket.IO
    crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Configure CORS with explicit origin
app.use(cors({
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

const io = new Server(server, {
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

const userSocketMap = {};
const getAllConnectedClients = (roomId) => {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId]
        };
    });
}

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle joining room
    socket.on('join', ({ roomId, username }) => {
        try {
            // Validate inputs
            const roomValidation = validateRoomId(roomId);
            const usernameValidation = validateUsername(username);

            if (!roomValidation.isValid) {
                socket.emit('error', { message: roomValidation.error });
                return;
            }

            if (!usernameValidation.isValid) {
                socket.emit('error', { message: usernameValidation.error });
                return;
            }

            // Use sanitized values
            const sanitizedRoomId = roomValidation.sanitized;
            const sanitizedUsername = usernameValidation.sanitized;

            // Check room capacity
            const existingClients = getAllConnectedClients(sanitizedRoomId);
            if (existingClients.length >= 5) {
                socket.emit('error', { message: 'Room is full (max 5 members)' });
                return;
            }

            // Add user to map
            userSocketMap[socket.id] = sanitizedUsername;
            socket.join(sanitizedRoomId);

            // Get all clients in the room
            const clients = getAllConnectedClients(sanitizedRoomId);

            // Notify only OTHER clients about the new user (not the joiner)
            socket.to(sanitizedRoomId).emit('user-joined', {
                clients,
                username: sanitizedUsername,
                socketId: socket.id
            });

            // Send the current client list to the new joiner
            socket.emit('user-joined', {
                clients,
                username: sanitizedUsername,
                socketId: socket.id
            });
        } catch (error) {
            console.error('Join error:', error);
            socket.emit('error', { message: 'Failed to join room' });
        }
    });

    // Handle code changes with sender information
    socket.on('code-change', ({ roomId, code, sender }) => {
        try {
            // Validate code size
            const codeValidation = validateCode(code);
            if (!codeValidation.isValid) {
                socket.emit('error', { message: codeValidation.error });
                return;
            }

            // Emit to all clients in the room except sender
            socket.to(roomId).emit('code-change', { code, sender });
        } catch (error) {
            console.error('Code change error:', error);
        }
    });

    // Handle sync request
    socket.on('sync-code', ({ socketId, code }) => {
        try {
            io.to(socketId).emit('code-sync', { code });
        } catch (error) {
            console.error('Sync error:', error);
        }
    });

    // Handle disconnection
    socket.on('disconnecting', () => {
        try {
            const rooms = [...socket.rooms];
            rooms.forEach((roomId) => {
                // Notify other clients in the room
                socket.in(roomId).emit('user-disconnected', {
                    socketId: socket.id,
                    username: userSocketMap[socket.id] || 'Anonymous'
                });
            });
        } catch (error) {
            console.error('Disconnecting error:', error);
        }
    });

    socket.on('disconnect', () => {
        try {
            delete userSocketMap[socket.id];
        } catch (error) {
            console.error('Disconnect error:', error);
        }
    });

    // Handle leaving room
    socket.on('leave', ({ roomId }) => {
        try {
            const username = userSocketMap[socket.id] || 'Anonymous';
            socket.leave(roomId);
            const clients = getAllConnectedClients(roomId);
            clients.forEach(({ socketId }) => {
                io.to(socketId).emit('user-left', {
                    socketId: socket.id,
                    username
                });
            });
        } catch (error) {
            console.error('Leave error:', error);
        }
    });

    // Handle messages with proper event names
    socket.on('send-message', ({ roomId, message, sender, time }) => {
        try {
            // Validate message
            const messageValidation = validateMessage(message);
            if (!messageValidation.isValid) {
                socket.emit('error', { message: messageValidation.error });
                return;
            }

            // Broadcast the sanitized message to all clients in the room
            io.in(roomId).emit('receive-message', {
                message: messageValidation.sanitized,
                sender,
                time
            });
        } catch (error) {
            console.error('Message error:', error);
        }
    });

    // Handle code execution output sync
    socket.on('code-output', ({ roomId, output, sender }) => {
        try {
            // Broadcast the output to all clients in the room
            io.in(roomId).emit('code-output', {
                output,
                sender
            });
        } catch (error) {
            console.error('Code output error:', error);
        }
    });
});

// io.on('connection',(socket)=>
// {


// });

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Accepting connections from: ${FRONTEND_URL}`);
});
