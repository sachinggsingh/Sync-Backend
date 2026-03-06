const { createClerkClient } = require('@clerk/clerk-sdk-node');
require('dotenv').config();

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY;

if (!CLERK_SECRET_KEY) {
    console.error('CRITICAL WARNING: CLERK_SECRET_KEY is not set in environment variables!');
}

const clerkClient = createClerkClient({
    secretKey: CLERK_SECRET_KEY,
    publishableKey: CLERK_PUBLISHABLE_KEY
});

module.exports = { clerkClient };
