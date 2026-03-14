const winston = require('winston');
const { trace } = require('@opentelemetry/api');


const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format((info) => {
            const span = trace.getActiveSpan();
            if (span) {
            // Attach trace information so logs can be correlated
            // with distributed traces in tools like Jaeger/Grafana
                const ctx = span.spanContext();
                info.trace_id = ctx.traceId;
                info.span_id = ctx.spanId;
                info.trace_flags = ctx.traceFlags.toString(16);
            }
            // This helps identify which service generated the log
            info.service = process.env.OTEL_SERVICE_NAME || 'sync-server';
            return info;
        })(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),

                winston.format.printf(({level, message,timestamp,...meta})=>{
                    return `${timestamp} [${level}]: ${message} ${JSON.stringify(meta)}`
                })
            )
        }),
    ]
});

module.exports = { logger };
