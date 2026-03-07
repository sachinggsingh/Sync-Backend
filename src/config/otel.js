const { NodeSDK } = require("@opentelemetry/sdk-node")
const { getNodeAutoInstrumentations } = require("@opentelemetry/auto-instrumentations-node")
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http")
const { AlwaysOnSampler } = require("@opentelemetry/sdk-trace-node")
const { BatchLogRecordProcessor } = require("@opentelemetry/sdk-logs");
const { OTLPLogExporter } = require("@opentelemetry/exporter-logs-otlp-http");
// Note: PeriodicExportingMetricReader and OTLPMetricExporter simplified for version compatibility
// If metrics are required, ensure versions of sdk-node and sdk-metrics are compatible.

const sdk = new NodeSDK({
    instrumentations: [getNodeAutoInstrumentations()],
    traceExporter: new OTLPTraceExporter(),
    sampler: new AlwaysOnSampler(),
    serviceName: process.env.OTEL_SERVICE_NAME || 'sync-server',
    logRecordProcessor: new BatchLogRecordProcessor(new OTLPLogExporter({
        url: process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT || 'http://localhost:4318/v1/logs'
    }))
})

sdk.start()
// Graceful shutdown
process.on('SIGTERM', () => {
    sdk.shutdown().then(
        () => console.log('OpenTelemetry SDK terminated'),
        (err) => console.error('Error terminating OpenTelemetry SDK', err)
    );
});

module.exports = {
    sdk
}
