"""Optional OpenTelemetry + enrichment latency metrics."""

from __future__ import annotations

import logging
import os
import time
from contextlib import contextmanager
from typing import Iterator

LOG = logging.getLogger("millipede_llm_worker.telemetry")
_ENRICH_SAMPLES = 0
_ENRICH_TOTAL_MS = 0.0


def setup_otel(service_name: str = "millipede-llm-worker") -> None:
    endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT")
    if not endpoint:
        LOG.debug("OTEL export disabled (set OTEL_EXPORTER_OTLP_ENDPOINT to enable)")
        return

    try:
        from opentelemetry import trace
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
    except ImportError:
        LOG.info(
            "OTEL_EXPORTER_OTLP_ENDPOINT=%s but opentelemetry SDK not installed "
            "(pip install -e '.[otel]')",
            endpoint,
        )
        return

    provider = TracerProvider(resource=Resource.create({"service.name": service_name}))
    provider.add_span_processor(
        BatchSpanProcessor(OTLPSpanExporter(endpoint=f"{endpoint.rstrip('/')}/v1/traces"))
    )
    trace.set_tracer_provider(provider)
    LOG.info("OpenTelemetry export enabled for %s", service_name)


@contextmanager
def enrich_span(event_id: str) -> Iterator[None]:
    global _ENRICH_SAMPLES, _ENRICH_TOTAL_MS

    start = time.perf_counter()
    try:
        from opentelemetry import trace

        tracer = trace.get_tracer("millipede_llm_worker")
        with tracer.start_as_current_span("enrich_event") as span:
            span.set_attribute("event.id", event_id)
            yield
    except ImportError:
        yield
    finally:
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        _ENRICH_SAMPLES += 1
        _ENRICH_TOTAL_MS += elapsed_ms
        LOG.debug("enrich_event event_id=%s duration_ms=%.2f", event_id, elapsed_ms)


def enrichment_avg_ms() -> float:
    if _ENRICH_SAMPLES == 0:
        return 0.0
    return round(_ENRICH_TOTAL_MS / _ENRICH_SAMPLES, 3)
