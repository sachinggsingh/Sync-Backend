const { logger } = require("../src/utils/logger")
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { initSocket } = require('./sockets');


const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

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
    logger.info('Health Check Started of the Server', {
        timestamp: new Date().toISOString()
    })
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    logger.info('Health Check Completed of the Server', {
        timestamp: new Date().toISOString()
    })
});

// Initialize Socket.io
initSocket(server, FRONTEND_URL);

module.exports = { app, server };
