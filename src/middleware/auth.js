const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const { clerkClient } = require('../config/clerk');

/**
 * Middleware to verify Clerk authentication tokens from Socket.IO connections
 * Extracts the token from socket handshake auth and validates it
 */
const verifyClerkToken = async (socket, next) => {
    try {
        console.log(`[Auth] New connection attempt: ${socket.id}`);
        const token = socket.handshake.auth?.token;

        if (!token) {
            console.error(`[Auth] No token provided for socket ${socket.id}`);
            return next(new Error('Authentication required'));
        }

        try {
            // Verify the session token
            const sessionClaims = await clerkClient.verifyToken(token);

            if (!sessionClaims) {
                console.error(`[Auth] Invalid token (no claims) for socket ${socket.id}`);
                return next(new Error('Invalid authentication token'));
            }

            // Attach user information to socket
            socket.userId = sessionClaims.sub; // Clerk user ID
            socket.sessionId = sessionClaims.sid; // Session ID

            console.log(`[Auth] User authenticated: ${socket.userId} (Socket: ${socket.id})`);
            next();
        } catch (verifyError) {
            console.error(`[Auth] Token verification failed for socket ${socket.id}:`, verifyError.message);
            return next(new Error('Invalid or expired token'));
        }
    } catch (error) {
        console.error(`[Auth] Middleware error for socket ${socket.id}:`, error);
        return next(new Error('Authentication failed'));
    }
};

/**
 * Optional: Express middleware for HTTP routes (if needed)
 */
const clerkExpressAuth = ClerkExpressRequireAuth();

module.exports = {
    verifyClerkToken,
    clerkExpressAuth
};
