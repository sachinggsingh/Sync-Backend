// Simple authentication middleware stub - no external service.
//
// In this project we currently do not enforce authentication at the
// Socket.IO handshake layer. The React client sends the username and room id
// as part of the regular `join` event payload instead of `handshake.auth`.
//
// When this file was originally written it rejected any socket that did not
// provide `handshake.auth.name` and `handshake.auth.roomId`. That behaviour
// works in local dev if the middleware is not wired up, but in the Docker /
// production build (where `io.use(verifyAuth)` is active) it caused the
// server to immediately disconnect clients with an "Authentication required"
// error as soon as they tried to create/join a room.
//
// To keep the current client implementation working we treat this middleware
// as a no‑op: all sockets are allowed through and room/user validation
// continues to happen inside the individual event handlers (see `join`,
// `send-message`, etc.).
const verifyAuth = (socket, next) => {
    // If in the future we decide to move auth into the handshake, we can
    // populate `socket.authError` here and let the higher‑level `ensureAuth`
    // helper in `sockets/handlers.js` enforce it per‑event.
    socket.authError = null;
    next();
};

module.exports = {
    verifyAuth,
};
