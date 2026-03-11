const { validateRoomId, validateUsername, validateMessage, validateCode } = require('../middleware/validator');
const { trace, SpanStatusCode } = require("@opentelemetry/api")
const { logger } = require('../utils/logger')
const userSocketMap = new Map();

const tracer = trace.getTracer("sync-editor");
const getAllConnectedClients = (io, roomId) => {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap.get(socketId)
        };
    });
};

const registerHandlers = (io, socket) => {
    console.log('Client connected:', socket.id);
    logger.info('Client connected:', {
        socketId: socket.id,
        username: userSocketMap.get(socket.id),
        roomId: Array.from(socket.rooms)
    })

    // helper that makes sure a socket was successfully authenticated
    // during the handshake.  When `authError` is set we emit a dedicated
    // event and return false so callers can early‑exit.
    const ensureAuth = (ctx) => {
        if (socket.authError) {
            // If an event handler passed context information we include it
            // in the log entry for debugging.
            logger.warn('Unauthenticated socket event', {
                socketId: socket.id,
                error: socket.authError,
                context: ctx || {}
            });
            socket.emit('auth-error', { message: socket.authError });
            return false;
        }
        return true;
    };

    // Handle joining room
    socket.on('join', ({ roomId, username }) => {
        if (!ensureAuth({event: 'join', roomId, username})) return;
        tracer.startActiveSpan("join", (span) => {
            try {
                span.setAttribute("socket.id", socket.id);
                span.setAttribute("username", username);
                span.setAttribute("roomId", roomId);
                logger.info('Joining room:', {
                    roomId,
                    username,
                    socketId: socket.id
                })

                const roomValidation = validateRoomId(roomId);
                const usernameValidation = validateUsername(username);

                if (!roomValidation.isValid) {
                    socket.emit('error', { message: roomValidation.error });
                    span.setStatus({ code: SpanStatusCode.ERROR, message: roomValidation.error });
                    logger.error('Joining room:', {
                        roomId,
                        username,
                        socketId: socket.id,
                        error: roomValidation.error
                    })
                    return;
                }

                if (!usernameValidation.isValid) {
                    socket.emit('error', { message: usernameValidation.error });
                    span.setStatus({ code: SpanStatusCode.ERROR, message: usernameValidation.error });
                    logger.error('Joining room:', {
                        roomId,
                        username,
                        socketId: socket.id,
                        error: usernameValidation.error
                    })
                    return;
                }

                const sanitizedRoomId = roomValidation.sanitized;
                const sanitizedUsername = usernameValidation.sanitized;

                const existingClients = getAllConnectedClients(io, sanitizedRoomId);
                if (existingClients.length >= 5) {
                    socket.emit('error', { message: 'Room is full (max 5 members)' });
                    span.setStatus({ code: SpanStatusCode.ERROR, message: 'Room is full' });
                    logger.error('Joining room:', {
                        roomId,
                        username,
                        socketId: socket.id,
                        error: 'Room is full'
                    })
                    return;
                }

                userSocketMap.set(socket.id, sanitizedUsername);
                socket.join(sanitizedRoomId);

                const clients = getAllConnectedClients(io, sanitizedRoomId);

                io.in(sanitizedRoomId).emit('user-joined', {
                    clients,
                    username: sanitizedUsername,
                    socketId: socket.id
                });

                span.setStatus({ code: SpanStatusCode.OK });
            } catch (error) {
                console.error('Join error:', error);
                socket.emit('error', { message: 'Failed to join room' });
                span.recordException(error);
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
                logger.error('Joining room:', {
                    roomId,
                    username,
                    socketId: socket.id,
                    error: error.message
                })
            } finally {
                span.end();
            }
        });
    });



    // Handle code changes
    socket.on('code-change', ({ roomId, code, sender }) => {
        if (!ensureAuth({event: 'code-change', roomId, sender})) return;
        tracer.startActiveSpan("code-change", (span) => {
            try {
                span.setAttribute("socket.id", socket.id);
                span.setAttribute("username", sender);
                span.setAttribute("roomId", roomId);
                const codeValidation = validateCode(code);
                if (!codeValidation.isValid) {
                    socket.emit('error', { message: codeValidation.error });
                    span.setStatus({ code: SpanStatusCode.ERROR, message: codeValidation.error });
                    return;
                }
                const sanitizedCode = codeValidation.sanitized;
                socket.to(roomId).emit('code-change', { code: sanitizedCode, sender });
                span.setStatus({ code: SpanStatusCode.OK }); // Ok
            } catch (error) {
                span.recordException(error)
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
                console.error('Code change error:', error);
                logger.error('Code change error:', {
                    roomId,
                    code,
                    sender,
                    socketId: socket.id,
                    error: error.message
                })
            } finally {
                span.end();
            }
        })
    });

    // Handle sync request
    socket.on('sync-code', ({ socketId, code }) => {
        if (!ensureAuth({event: 'sync-code', targetSocketId: socketId})) return;
        tracer.startActiveSpan("sync-code", (span) => {
            try {
                span.setAttribute("socket.id", socket.id);
                span.setAttribute("target.socketId", socketId);
                io.to(socketId).emit('code-sync', { code });
                span.setStatus({ code: SpanStatusCode.OK });
            } catch (error) {

                span.recordException(error)
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
                console.error('Sync error:', error);
                logger.error('Sync error:', {
                    targetSocketId: socketId,
                    code,
                    socketId: socket.id,
                    error: error.message
                })
            } finally {
                span.end();
            }
        })
    });

    // Handle disconnection
    socket.on('disconnecting', () => {
        tracer.startActiveSpan("disconnecting", (span) => {
            try {
                const username = userSocketMap.get(socket.id) || 'Anonymous';
                span.setAttribute("socket.id", socket.id);
                span.setAttribute("username", username);

                const rooms = [...socket.rooms];
                rooms.forEach((roomId) => {
                    socket.in(roomId).emit('user-disconnected', {
                        socketId: socket.id,
                        username: username
                    });
                });
                span.setStatus({ code: SpanStatusCode.OK });
            } catch (error) {

                span.recordException(error)
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
                console.error('Disconnecting error:', error);
                logger.error('Disconnecting error:', {
                    socketId: socket.id,
                    error: error.message
                })
            } finally {
                span.end();
            }
        })
    });

    socket.on('disconnect', () => {
        tracer.startActiveSpan("disconnect", (span) => {
            try {
                span.setAttribute("socket.id", socket.id);
                span.setAttribute("username", userSocketMap.get(socket.id) || 'Anonymous');
                userSocketMap.delete(socket.id);
                span.setStatus({ code: SpanStatusCode.OK });
            } catch (error) {

                span.recordException(error)
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
                console.error('Disconnect error:', error);
                logger.error('Disconnect error:', {
                    socketId: socket.id,
                    error: error.message
                })
            } finally {
                span.end();
            }
        })
    });

    // Handle leaving room
    socket.on('leave', ({ roomId }) => {
        if (!ensureAuth({event: 'leave', roomId})) return;
        tracer.startActiveSpan("leave", (span) => {
            try {
                const username = userSocketMap.get(socket.id) || 'Anonymous';
                span.setAttribute("socket.id", socket.id);
                span.setAttribute("username", username);
                span.setAttribute("roomId", roomId);

                socket.leave(roomId);
                const clients = getAllConnectedClients(io, roomId);
                span.setAttribute("clients", clients.length);

                io.to(roomId).emit('user-left', {
                    socketId: socket.id,
                    username
                });
                span.setStatus({ code: SpanStatusCode.OK });
            } catch (error) {

                span.recordException(error)
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
                console.error('Leave error:', error);
                logger.error('Leave error:', {
                    socketId: socket.id,
                    error: error.message
                })
            } finally {
                span.end()
            }
        })
    });

    // Handle messages
    socket.on('send-message', ({ roomId, message, sender, time }) => {
        if (!ensureAuth({event: 'send-message', roomId, sender})) return;
        tracer.startActiveSpan("send-message", (span) => {
            try {
                span.setAttribute("socket.id", socket.id);
                span.setAttribute("username", sender);
                span.setAttribute("roomId", roomId);
                const messageValidation = validateMessage(message);
                if (!messageValidation.isValid) {
                    socket.emit('error', { message: messageValidation.error });
                    span.setStatus({ code: SpanStatusCode.ERROR, message: messageValidation.error })
                    return;
                }
                const sanitizedMessage = messageValidation.sanitized;
                span.setAttribute("message", sanitizedMessage);
                io.in(roomId).emit('receive-message', {
                    message: sanitizedMessage,
                    sender,
                    time
                });
                span.setStatus({ code: SpanStatusCode.OK });
            } catch (error) {
                span.recordException(error)
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
                console.error('Message error:', error);
                logger.error('Message error:', {
                    socketId: socket.id,
                    error: error.message
                })
            } finally {
                span.end()
            }
        })
    });

    // Handle code execution output sync
    socket.on('code-output', ({ roomId, output, sender }) => {
        if (!ensureAuth({event: 'code-output', roomId, sender})) return;
        tracer.startActiveSpan("code-output", (span) => {
            try {
                span.setAttribute("socket.id", socket.id);
                span.setAttribute("username", sender);
                span.setAttribute("roomId", roomId);
                logger.info('Code Output:', {
                    socketId: socket.id
                })
                io.in(roomId).emit('code-output', {
                    output,
                    sender
                });
                span.setStatus({ code: SpanStatusCode.OK });
            } catch (error) {
                span.recordException(error)
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
                console.error('Code output error:', error);
                logger.error('Code output error:', {
                    socketId: socket.id,
                    error: error.message
                })
            } finally {
                span.end()
            }
        })
    });
};

module.exports = {
    registerHandlers,
    getAllConnectedClients
};
