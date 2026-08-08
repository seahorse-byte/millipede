use std::sync::atomic::{AtomicU64, Ordering};
use std::time::Instant;

static METRICS_SAMPLES: AtomicU64 = AtomicU64::new(0);
static METRICS_TOTAL_US: AtomicU64 = AtomicU64::new(0);
static STORE_SAMPLES: AtomicU64 = AtomicU64::new(0);
static STORE_TOTAL_US: AtomicU64 = AtomicU64::new(0);

pub struct LatencyGuard {
    start: Instant,
    kind: LatencyKind,
}

enum LatencyKind {
    Metrics,
    Store,
}

impl LatencyGuard {
    pub fn metrics() -> Self {
        Self {
            start: Instant::now(),
            kind: LatencyKind::Metrics,
        }
    }

    pub fn store() -> Self {
        Self {
            start: Instant::now(),
            kind: LatencyKind::Store,
        }
    }
}

impl Drop for LatencyGuard {
    fn drop(&mut self) {
        let micros = self.start.elapsed().as_micros().min(u128::from(u64::MAX)) as u64;
        match self.kind {
            LatencyKind::Metrics => {
                METRICS_SAMPLES.fetch_add(1, Ordering::Relaxed);
                METRICS_TOTAL_US.fetch_add(micros, Ordering::Relaxed);
            }
            LatencyKind::Store => {
                STORE_SAMPLES.fetch_add(1, Ordering::Relaxed);
                STORE_TOTAL_US.fetch_add(micros, Ordering::Relaxed);
            }
        }
    }
}

fn avg_ms(samples: u64, total_us: u64) -> f64 {
    if samples == 0 {
        return 0.0;
    }
    (total_us as f64 / samples as f64) / 1000.0
}

#[derive(serde::Serialize)]
pub struct TelemetrySummary {
    otel_export: &'static str,
    metrics_handler_avg_ms: f64,
    event_store_avg_ms: f64,
    metrics_samples: u64,
    store_samples: u64,
}

pub fn summary() -> TelemetrySummary {
    let metrics_samples = METRICS_SAMPLES.load(Ordering::Relaxed);
    let metrics_total = METRICS_TOTAL_US.load(Ordering::Relaxed);
    let store_samples = STORE_SAMPLES.load(Ordering::Relaxed);
    let store_total = STORE_TOTAL_US.load(Ordering::Relaxed);

    TelemetrySummary {
        otel_export: if std::env::var("OTEL_EXPORTER_OTLP_ENDPOINT").is_ok() {
            "enabled"
        } else {
            "disabled"
        },
        metrics_handler_avg_ms: (avg_ms(metrics_samples, metrics_total) * 1000.0).round() / 1000.0,
        event_store_avg_ms: (avg_ms(store_samples, store_total) * 1000.0).round() / 1000.0,
        metrics_samples,
        store_samples,
    }
}

pub fn init_tracing_otel() {
    let Some(endpoint) = std::env::var("OTEL_EXPORTER_OTLP_ENDPOINT").ok() else {
        return;
    };

    tracing::info!(%endpoint, "OTEL_EXPORTER_OTLP_ENDPOINT set — export via tracing JSON logs until OTLP collector wired");
}
