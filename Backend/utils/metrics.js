import client from "prom-client";

// Automatically track Node.js default runtime metrics
// like event loop lag, memory, and CPU usage
client.collectDefaultMetrics();

export const httpRequestsTotal = new client.Counter({
    name: "http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "route", "status"],
});

export const httpRequestDuration = new client.Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route", "status"],
    buckets: [0.05, 0.1, 0.2, 0.3, 0.5, 1, 2, 5],
});

export { client };
