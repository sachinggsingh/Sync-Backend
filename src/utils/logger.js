const winston = require("winston");
const { OpenTelemetryTransportV3 } = require("@opentelemetry/winston-transport");

const colors = [
    'info',
    'error',
    'warn',
    'debug',
]
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize({ all: process.env.COLORIZE_LOGS === 'true' }),
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
                })
            )
        }),
        new OpenTelemetryTransportV3({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
    ],
});

function logWithTraceInfo(msg, level = 'info') {
    logger.log({ level, message: msg });
}
function logWithTraceError(msg, level = 'error') {
    logger.error({ level, message: msg })
}
function logWithTraceWarn(msg, level = 'warn') {
    logger.warn({ level, message: msg })
}
function logWithTraceDebug(msg, level = 'debug') {
    logger.debug({ level, message: msg })
}

module.exports = {
    logger,
    logWithTraceInfo,
    logWithTraceError,
    logWithTraceWarn,
    logWithTraceDebug
};
