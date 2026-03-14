// const winston = require('winston');
// const { trace } = require('@opentelemetry/api');
// const LokiTransport = require('winston-loki');

// const logger = winston.createLogger({
//     level: process.env.LOG_LEVEL || 'debug',
//     format: winston.format.combine(
//         winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
//         winston.format((info) => {
//             // Inject OpenTelemetry trace context
//             const span = trace.getActiveSpan();
//             if (span?.spanContext()) {
//                 const ctx = span.spanContext();
//                 info.trace_id = ctx.traceId;
//                 info.span_id = ctx.spanId;
//                 info.trace_flags = ctx.traceFlags.toString(16);
//             }
//             // Add service name for easy filtering
//             info.service = process.env.OTEL_SERVICE_NAME || 'sync-server';
//             return info;
//         })(),
//         winston.format.json()
//     ),
//     transports: [
//         // Console for docker logs
//         new winston.transports.Console({
//             format: winston.format.combine(
//                 winston.format.colorize(),
//                 winston.format.simple()
//             )
//         }),
//         // Direct to Loki (bypasses OTel Collector issues)
//         new LokiTransport({
//             host: 'http://loki:3100/loki/api/v1/push',
//             labels: {
//                 app: 'sync-server',
//                 service: process.env.OTEL_SERVICE_NAME || 'sync-server'
//             },
//             json: true,
//             batching: false,  // Immediate delivery for dev
//             timeout: 10000,
//             onConnectionError: (err) => {
//                 console.error(' Loki connection failed:', err.message);
//             }
//         })
//     ]
// });

// module.exports = { logger };
const winston = require('winston');
const { trace } = require('@opentelemetry/api');
const LokiTransport = require('winston-loki');

// const LOKI_HOST = process.env.LOKI_HOST || 'http://host.docker.internal:3100/loki/api/v1/push';

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format((info) => {
            const span = trace.getActiveSpan();
            if (span?.spanContext()) {
                const ctx = span.spanContext();
                info.trace_id = ctx.traceId;
                info.span_id = ctx.spanId;
                info.trace_flags = ctx.traceFlags.toString(16);
            }
            info.service = process.env.OTEL_SERVICE_NAME || 'sync-server';
            return info;
        })(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new LokiTransport({
            // host: LOKI_HOST,  // ✅ Uses ENV var - fixes DNS
            host: 'http://loki:3100/loki/api/v1/push',
            labels: {
                app: 'sync-server',
                service: process.env.OTEL_SERVICE_NAME || 'sync-server'
            },
            json: true,
            batching: false,
            timeout: 10000,
            onConnectionError: (err) => {
                console.error('Loki connection failed:', err.message);
            }
        })
    ]
});

module.exports = { logger };
