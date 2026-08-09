// Must be loaded before any other module (via `node --import ./tracing.js`,
// see package.json scripts) so OpenTelemetry's auto-instrumentation can
// patch http/express/mongoose/ioredis before they're first imported
// elsewhere. Importing this normally from inside server.js/worker.js would
// be too late — those modules would already be loaded unpatched.
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";

// OTEL_EXPORTER_OTLP_ENDPOINT is intentionally optional. Without it, the
// SDK still initializes and instruments everything correctly — it just has
// nowhere to send spans, so they're generated and dropped. This is honest:
// no fake collector is bundled here. Point this at any OTLP-compatible
// backend (Jaeger, Tempo, Honeycomb, etc) to actually see traces —
// e.g. OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces for a
// local Jaeger instance.
const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
});

const sdk = new NodeSDK({
    resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "saarthi-backend",
    }),
    traceExporter,
    instrumentations: [
        getNodeAutoInstrumentations({
            // Health-check polling would otherwise flood traces with noise.
            "@opentelemetry/instrumentation-http": {
                ignoreIncomingRequestHook: (req) => req.url === "/health",
            },
        }),
    ],
});

try {
    sdk.start();
    console.log("[tracing] OpenTelemetry started" + (process.env.OTEL_EXPORTER_OTLP_ENDPOINT ? ` — exporting to ${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}` : " — no OTEL_EXPORTER_OTLP_ENDPOINT set, spans are generated but not exported anywhere"));
} catch (error) {
    console.error("[tracing] Failed to start OpenTelemetry:", error.message);
}

process.on("SIGTERM", () => {
    sdk.shutdown().finally(() => process.exit(0));
});
