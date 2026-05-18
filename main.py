import asyncio
import os
import sys
from fastapi import FastAPI, Request
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from prometheus_fastapi_instrumentator import Instrumentator

# --- 0. Core debug output (Printed immediately in logs when container starts) ---
import prometheus_fastapi_instrumentator
print("\n" + "="*50)
print(f"🔎 DEBUG: Python Executable: {sys.executable}")
print(f"🔎 DEBUG: Python Path: {sys.path}")
print(f"🔎 DEBUG: Library Version: {prometheus_fastapi_instrumentator.__version__}")
print(f"🔎 DEBUG: Library File Location: {prometheus_fastapi_instrumentator.__file__}")
print("="*50 + "\n")

# --- 1. Configure OpenTelemetry ---
OTLP_ENDPOINT = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://jaeger:4318/v1/traces")

provider = TracerProvider()
processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=OTLP_ENDPOINT))
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(__name__)

app = FastAPI(title="Performance-Test-API")

# --- 2. Define Trace ID injection function ---
def trace_integration(expose_exemplars: bool = True):
    def instrumentation(info):
        if expose_exemplars:
            current_span = trace.get_current_span()
            if current_span and current_span.get_span_context().is_valid:
                trace_id = format(current_span.get_span_context().trace_id, '032x')
                return {"trace_id": trace_id}
        return {}
    return instrumentation

# --- 3. Initialize monitoring (No parameters for now, ensuring service starts) ---
# 💡 The parentheses are empty here to avoid triggering TypeError and container restarts
instrumentator = Instrumentator()

# Attempt to manually detect if the parameter is supported (for further debugging)
if hasattr(instrumentator, "label_formatter"):
    print("✅ System Check: This version supports 'label_formatter'")
else:
    print("❌ System Check: This version DOES NOT support 'label_formatter'")

# Execute basic injection
instrumentator.instrument(app).expose(app)

# Inject FastAPI tracing
FastAPIInstrumentor.instrument_app(app)

# --- 4. Business endpoints ---
@app.post("/process-order")
async def process_order(request: Request):
    current_span = trace.get_current_span()
    trace_id = format(current_span.get_span_context().trace_id, '032x')
    
    with tracer.start_as_current_span("order-logic-heavy"):
        await asyncio.sleep(0.5) 
        return {
            "status": "Order processed successfully",
            "trace_id": trace_id,
            "location": "Brisbane Data Center"
        }

@app.get("/")
async def root():
    return {"message": "Service is UP", "monitoring": "/metrics"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)