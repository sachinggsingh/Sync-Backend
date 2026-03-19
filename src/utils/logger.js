const winston = require('winston');
const { trace } = require('@opentelemetry/api');

const LOG_DIR = process.env.LOG_DIR || null;
const IS_PROD = process.env.NODE_ENV === 'production';

function buildBaseEnricher() {
    return winston.format((info) => {
        const span = trace.getActiveSpan();
        if (span) {
            const ctx = span.spanContext();
            info.trace_id = ctx.traceId;
            info.span_id = ctx.spanId;
            info.trace_flags = ctx.traceFlags.toString(16);
        }
        info.service = process.env.OTEL_SERVICE_NAME || 'sync-server';
        return info;
    })();
}

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        buildBaseEnricher(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: IS_PROD
                ? winston.format.combine(
                    winston.format.timestamp(),
                    buildBaseEnricher(),
                    winston.format.json()
                )
                : winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    winston.format.printf(({ level, message, timestamp, ...meta }) => {
                        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                        return `${timestamp} [${level}]: ${message}${metaStr}`;
                    })
                )
        }),
    ]
});

if (LOG_DIR) {
    logger.add(new winston.transports.File({
        filename: `${LOG_DIR.replace(/\/+$/g, '')}/app.log`,
        format: winston.format.combine(
            winston.format.timestamp(),
            buildBaseEnricher(),
            winston.format.json()
        )
    }));
}

module.exports = { logger };
