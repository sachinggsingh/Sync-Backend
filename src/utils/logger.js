const winston = require('winston');
const { trace } = require('@opentelemetry/api');
const { OpenTelemetryTransportV3 } = require('@opentelemetry/winston-transport');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format((info) => {
            // OpenTelemetry auto-injects trace context
            const span = trace.getActiveSpan();
            if (span) {
                const spanContext = span.spanContext();
                info.trace_id = spanContext.traceId;
                info.span_id = spanContext.spanId;
            }
            return info;
        })(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        // Ships logs to OTel Collector → Loki → Grafana
        new OpenTelemetryTransportV3()
    ]
});

module.exports = { logger };
