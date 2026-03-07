const validator = require('validator');

/**
 * Validates and sanitizes room ID
 * @param {string} roomId - Room ID to validate
 * @returns {Object} - {isValid: boolean, sanitized: string, error: string}
 */
const validateRoomId = (roomId) => {
    if (!roomId || typeof roomId !== 'string') {
        return { isValid: false, error: 'Room ID is required' };
    }

    const sanitized = validator.trim(roomId);

    if (sanitized.length < 3 || sanitized.length > 100) {
        return { isValid: false, error: 'Room ID must be between 3 and 100 characters' };
    }

    // Allow alphanumeric, hyphens, and underscores
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
        return { isValid: false, error: 'Room ID contains invalid characters' };
    }

    return { isValid: true, sanitized };
};

/**
 * Validates and sanitizes username
 * @param {string} username - Username to validate
 * @returns {Object} - {isValid: boolean, sanitized: string, error: string}
 */
const validateUsername = (username) => {
    if (!username || typeof username !== 'string') {
        return { isValid: false, error: 'Username is required' };
    }

    let sanitized = validator.trim(username);
    sanitized = validator.escape(sanitized); // Escape HTML entities

    if (sanitized.length < 2 || sanitized.length > 30) {
        return { isValid: false, error: 'Username must be between 2 and 30 characters' };
    }

    return { isValid: true, sanitized };
};

/**
 * Validates and sanitizes message content
 * @param {string} message - Message to validate
 * @returns {Object} - {isValid: boolean, sanitized: string, error: string}
 */
const validateMessage = (message) => {
    if (!message || typeof message !== 'string') {
        return { isValid: false, error: 'Message is required' };
    }

    let sanitized = validator.trim(message);
    sanitized = validator.escape(sanitized); // Escape HTML entities

    if (sanitized.length === 0) {
        return { isValid: false, error: 'Message cannot be empty' };
    }

    if (sanitized.length > 1000) {
        return { isValid: false, error: 'Message is too long (max 1000 characters)' };
    }

    return { isValid: true, sanitized };
};

/**
 * Validates code content
 * @param {string} code - Code to validate
 * @returns {Object} - {isValid: boolean, error: string}
 */
const validateCode = (code) => {
    if (typeof code !== 'string') {
        return { isValid: false, error: 'Code must be a string' };
    }

    // Allow empty code
    if (code.length > 100000) { // 100KB limit
        return { isValid: false, error: 'Code is too large (max 100KB)' };
    }

    return { isValid: true };
};

module.exports = {
    validateRoomId,
    validateUsername,
    validateMessage,
    validateCode
};
