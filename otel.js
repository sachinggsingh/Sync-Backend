const { NodeSDK } = require("@opentelemetry/sdk-node")
const { autoInstrumentations } = require("@opentelemetry/auto-instrumentations-node")
const { OTLPMetricExporter } = require("@opentelemetry/exporter-metrics-otlp-http")
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http")
const { ATTR_SERVICE_NAME } = require("@opentelemetry/semantic-conventions")

const sdk = new NodeSDK({
    instrumentations: [autoInstrumentations()],
    metricReader: new OTLPMetricExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    }),
    traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    }),
    resource: {
        [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME,
    },
})

sdk.start()

module.exports = {
    sdk
}
