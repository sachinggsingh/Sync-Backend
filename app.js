require('./otel'); // Initialize OpenTelemetry
const express = require('express');
const app = express();
require('dotenv').config();
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { initSocket } = require('./socket.io');

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

// Initialize Socket.io
initSocket(server, FRONTEND_URL);

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Accepting connections from: ${FRONTEND_URL}`);
});

