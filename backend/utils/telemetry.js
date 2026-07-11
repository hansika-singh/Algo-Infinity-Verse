import { NodeSDK } from '@opentelemetry/sdk-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';

// The Prometheus exporter starts an HTTP server on port 9464 by default
// and exposes a /metrics endpoint for Prometheus to scrape.
const prometheusExporter = new PrometheusExporter({
  port: 9464,
  endpoint: '/metrics',
});

const sdk = new NodeSDK({
  metricReader: prometheusExporter,
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
  ],
});

export function startTelemetry() {
  try {
    sdk.start();
    console.log('OpenTelemetry initialized. Prometheus metrics available on port 9464 at /metrics');
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => console.log('OpenTelemetry terminated'))
        .catch((error) => console.error('Error terminating OpenTelemetry', error))
        .finally(() => process.exit(0));
    });
  } catch (err) {
    console.error('Failed to start OpenTelemetry:', err);
  }
}
