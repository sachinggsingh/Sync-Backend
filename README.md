# SyncEditor Server

Backend server for the SyncEditor collaborative code editor platform.

## Overview

This is a Node.js/Express server that provides real-time collaboration features using Socket.IO. It handles room management, user connections, code synchronization, and chat messaging.

## Features

- **Real-Time WebSocket Communication** using Socket.IO
- **Room Management** with unique room IDs
- **User Session Tracking** with connection state management
- **Code Synchronization** with debounced updates
- **Chat Messaging** with validation and sanitization
- **Security Middleware** including Helmet, CORS, and rate limiting
- **Input Validation** for all user-generated content
- **Health Check Endpoint** for monitoring

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
PORT=5555
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
SOCKET_PING_TIMEOUT=120000
SOCKET_PING_INTERVAL=30000
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and timestamp.

## Socket.IO Events

### Client → Server

#### `join`
Join a room with username and room ID.
```javascript
socket.emit('join', { roomId, username });
```

#### `leave`
Leave the current room.
```javascript
socket.emit('leave', { roomId, username });
```

#### `code-change`
Send code changes to other users in the room.
```javascript
socket.emit('code-change', { roomId, code, sender });
```

#### `send-message`
Send a chat message to the room.
```javascript
socket.emit('send-message', { roomId, message, sender, time });
```

### Server → Client

#### `user-joined`
Notifies when a user joins the room.
```javascript
socket.on('user-joined', ({ clients, username, socketId }) => {
  // Handle user joined
});
```

#### `user-left`
Notifies when a user leaves the room.
```javascript
socket.on('user-left', ({ socketId, username }) => {
  // Handle user left
});
```

#### `user-disconnected`
Notifies when a user disconnects.
```javascript
socket.on('user-disconnected', ({ socketId, username }) => {
  // Handle user disconnected
});
```

#### `code-change`
Receives code changes from other users.
```javascript
socket.on('code-change', ({ code, sender }) => {
  // Update editor with new code
});
```

#### `receive-message`
Receives chat messages.
```javascript
socket.on('receive-message', ({ message, sender, time }) => {
  // Display message in chat
});
```

#### `error`
Receives error messages from server.
```javascript
socket.on('error', ({ message }) => {
  // Handle error
});
```

## Security

### Validation Rules

- **Room ID**: 3-100 alphanumeric characters, hyphens, underscores
- **Room Capacity**: Maximum 5 members per room
- **Username**: 2-30 characters, HTML entities escaped
- **Message**: 1-1000 characters, HTML entities escaped
- **Code**: Maximum 100KB

### Rate Limiting

- **API Endpoints**: 100 requests per 15 minutes per IP
- **Room Operations**: 10 requests per minute per IP

### Security Headers

Helmet.js provides:
- Content Security Policy
- XSS Protection
- No Sniff
- Frameguard
- HSTS

## Architecture

```
Server/
├── app.js              # Main server file
├── middleware/
│   ├── rateLimiter.js  # Rate limiting configuration
│   └── validator.js    # Input validation functions
├── .env.example        # Environment variables template
└── package.json
```

## Dependencies

- **express**: Web framework
- **socket.io**: Real-time communication
- **helmet**: Security middleware
- **compression**: Response compression
- **cors**: Cross-origin resource sharing
- **validator**: Input validation
- **express-rate-limit**: Rate limiting
- **dotenv**: Environment configuration

## Development Dependencies

- **nodemon**: Auto-restart on file changes

## Performance Considerations

- Code changes are debounced on the client side
- Compression middleware reduces bandwidth
- Socket.IO transports: WebSocket (preferred), polling (fallback)
- Ping timeout: 120 seconds
- Ping interval: 30 seconds

## Error Handling

All socket event handlers include try-catch blocks and emit error events to clients when validation fails or exceptions occur.

## Monitoring

Use the `/health` endpoint for uptime monitoring and load balancer health checks.

## Deployment

### Environment Variables

Ensure the following are set in production:
- `NODE_ENV=production`
- `PORT` (cloud providers often set this)
- `FRONTEND_URL` (your deployed frontend URL)

### Scaling

For horizontal scaling:
- Use Socket.IO Redis adapter
- Configure sticky sessions on load balancer
- Use a managed Redis instance (AWS ElastiCache, Redis Cloud, etc.)

## License

MIT
