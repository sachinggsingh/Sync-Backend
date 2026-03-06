const { validateRoomId, validateUsername, validateMessage, validateCode } = require('./middleware/validator');
const { trace, SpanStatusCode } = require("@opentelemetry/api")
const userSocketMap = {};

const tracer = trace.getTracer("sync-editor");
const getAllConnectedClients = (io, roomId) => {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId]
        };
    });
};

const registerHandlers = (io, socket) => {
    console.log('Client connected:', socket.id);

    // Handle joining room
    socket.on('join', ({ roomId, username }) => {
        tracer.startActiveSpan("join", (span) => {
            try {
                span.setAttribute("socket.id", socket.id);
                span.setAttribute("username", username);
                span.setAttribute("roomId", roomId);

                const roomValidation = validateRoomId(roomId);
                const usernameValidation = validateUsername(username);

                if (!roomValidation.isValid) {
                    socket.emit('error', { message: roomValidation.error });
                    span.setStatus({ code: SpanStatusCode.ERROR, message: roomValidation.error });
                    return;
                }

                if (!usernameValidation.isValid) {
                    socket.emit('error', { message: usernameValidation.error });
                    span.setStatus({ code: SpanStatusCode.ERROR, message: usernameValidation.error });
                    return;
                }

                const sanitizedRoomId = roomValidation.sanitized;
                const sanitizedUsername = usernameValidation.sanitized;

                const existingClients = getAllConnectedClients(io, sanitizedRoomId);
                if (existingClients.length >= 5) {
                    socket.emit('error', { message: 'Room is full (max 5 members)' });
                    span.setStatus({ code: SpanStatusCode.ERROR, message: 'Room is full' });
                    return;
                }

                userSocketMap[socket.id] = sanitizedUsername;
                socket.join(sanitizedRoomId);

                const clients = getAllConnectedClients(io, sanitizedRoomId);

                socket.to(sanitizedRoomId).emit('user-joined', {
                    clients,
                    username: sanitizedUsername,
                    socketId: socket.id
                });

                socket.emit('user-joined', {
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

            } finally {
                span.end();
            }
        });
    });



    // Handle code changes
    socket.on('code-change', ({ roomId, code, sender }) => {
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
            } finally {
                span.end();
            }
        })
    });

    // Handle sync request
    socket.on('sync-code', ({ socketId, code }) => {
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
            } finally {
                span.end();
            }
        })
    });

    // Handle disconnection
    socket.on('disconnecting', () => {
        tracer.startActiveSpan("disconnecting", (span) => {
            try {
                const username = userSocketMap[socket.id] || 'Anonymous';
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
            } finally {
                span.end();
            }
        })
    });

    socket.on('disconnect', () => {
        tracer.startActiveSpan("disconnect", (span) => {
            try {
                span.setAttribute("socket.id", socket.id);
                span.setAttribute("username", userSocketMap[socket.id] || 'Anonymous');
                delete userSocketMap[socket.id];
                span.setStatus({ code: SpanStatusCode.OK });
            } catch (error) {

                span.recordException(error)
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
                console.error('Disconnect error:', error);
            } finally {
                span.end();
            }
        })
    });

    // Handle leaving room
    socket.on('leave', ({ roomId }) => {
        tracer.startActiveSpan("leave", (span) => {
            try {
                const username = userSocketMap[socket.id] || 'Anonymous';
                span.setAttribute("socket.id", socket.id);
                span.setAttribute("username", username);
                span.setAttribute("roomId", roomId);

                socket.leave(roomId);
                const clients = getAllConnectedClients(io, roomId);
                span.setAttribute("clients", clients.length);

                clients.forEach(({ socketId }) => {
                    io.to(socketId).emit('user-left', {
                        socketId: socket.id,
                        username
                    });
                });
                span.setStatus({ code: SpanStatusCode.OK });
            } catch (error) {

                span.recordException(error)
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
                console.error('Leave error:', error);
            } finally {
                span.end()
            }
        })
    });

    // Handle messages
    socket.on('send-message', ({ roomId, message, sender, time }) => {
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
            } finally {
                span.end()
            }
        })
    });

    // Handle code execution output sync
    socket.on('code-output', ({ roomId, output, sender }) => {
        tracer.startActiveSpan("code-output", (span) => {
            try {
                span.setAttribute("socket.id", socket.id);
                span.setAttribute("username", sender);
                span.setAttribute("roomId", roomId);
                io.in(roomId).emit('code-output', {
                    output,
                    sender
                });
                span.setStatus({ code: SpanStatusCode.OK });
            } catch (error) {
                span.recordException(error)
                span.setStatus({ code: SpanStatusCode.ERROR, message: error.message })
                console.error('Code output error:', error);
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
