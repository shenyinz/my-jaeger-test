# Jaeger & K6 Performance Testing Environment

This project is a complete containerized environment for demonstrating API and browser performance testing integrated with distributed tracing and metrics monitoring. It uses Docker Compose to orchestrate various observability and testing tools alongside a simulated backend service.

## Project Components & Functionalities

### 1. Simulated Backend Service (`app-service`)
- **Framework**: Python FastAPI (`main.py`).
- **Functionality**: Acts as the system under test. It provides endpoints (e.g., `/process-order`) that simulate business logic.
- **Observability**: 
  - Instrumented with OpenTelemetry to generate traces and send them to Jaeger via OTLP.
  - Uses `prometheus_fastapi_instrumentator` to expose a `/metrics` endpoint for Prometheus to scrape HTTP request metrics.

### 2. Jaeger (`jaeger`)
- **Functionality**: Distributed Tracing system.
- **Role**: Collects, stores, and visualizes trace data sent by the backend service. It helps identify performance bottlenecks and track request flows across services.
- **Storage**: Uses Badger for local file storage, persisted in the `./jaeger_data` volume to prevent data loss on container restart.

### 3. Prometheus (`prometheus`)
- **Functionality**: Time-series Monitoring Database.
- **Role**: 
  - Scrapes operational metrics from the FastAPI backend service (`/metrics`) and the Node Exporter.
  - Receives performance testing metrics directly from K6 via the remote write receiver.
- **Storage**: Persists monitoring data in the `./prometheus_data` volume.

### 4. Grafana (`grafana`)
- **Functionality**: Visualization Dashboard.
- **Role**: Connects to Prometheus as a data source to create comprehensive dashboards. Visualizes backend performance, hardware metrics, and K6 load testing results in real-time.
- **Storage**: Persists dashboards, data sources, and configurations in the `./grafana_data` volume.

### 5. Node Exporter (`node-exporter`)
- **Functionality**: Hardware and OS metrics exporter.
- **Role**: Collects system-level metrics (CPU, memory, disk I/O, network) from the host machine and exposes them for Prometheus to scrape, providing context on hardware utilization during load tests.

### 6. PostgreSQL Database (`postgres-db`)
- **Functionality**: Relational Database Management System.
- **Role**: A persistent database instance configured for development and testing purposes (database: `dev_db`), with data persisted in a Docker volume (`pgdata`). Can be used to simulate database-heavy workloads or as part of a Model Context Protocol (MCP) server.

### 7. K6 Performance Testing - API (`k6-api`)
- **Functionality**: Load testing tool.
- **Role**: Executes the API load testing script (`k6-script.js`) against the backend service.
- **Integration**: Generates W3C `traceparent` headers to correlate load test requests with Jaeger traces, and pushes test metrics (latency, error rates, throughput) directly to Prometheus via remote write.

### 8. K6 Performance Testing - Browser (`k6-browser`)
- **Functionality**: Browser-based performance testing tool.
- **Role**: Executes frontend load tests (`k6-browser-script.js`) using a headless browser to measure real user experience metrics. Sends metrics to Prometheus.

### 9. K6 Performance Testing - Jupiter HTTP (`k6-jupiter-http-script.js`)
- **Functionality**: Load testing tool for HTTPS protocol.
- **Role**: Executes the Jupiter HTTP testing script (`k6-jupiter-http-script.js`) to test services via the HTTPS protocol.

### 10. GitHub Actions CI/CD (`.github/workflows/`)
- **Functionality**: Continuous Integration pipeline.
- **Role**: Automates the execution of K6 load tests (API and browser) within the CI environment, ensuring performance is verified continuously.

## Running the Environment

Use Docker Compose to start all the services:

```bash
docker-compose up -d
```

To run a specific K6 test profile:

```bash
docker-compose --profile test up k6-api
```
