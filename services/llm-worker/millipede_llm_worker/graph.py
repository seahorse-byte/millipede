"""LangGraph-style enrichment pipeline (sequential node graph)."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Callable

from millipede_llm_worker.enrich import enrich_scores

Node = Callable[["EnrichmentState"], "EnrichmentState"]


@dataclass
class EnrichmentState:
    event_id: str
    source: str
    payload: dict[str, Any]
    sentiment: float | None = None
    risk_score: float | None = None
    enriched_at: str | None = None
    notes: list[str] = field(default_factory=list)


def parse_event(state: EnrichmentState) -> EnrichmentState:
    if not state.event_id:
        raise ValueError("missing event id")
    if not state.source:
        state.source = "unknown"
    state.notes.append("parsed")
    return state


def score_event(state: EnrichmentState) -> EnrichmentState:
    sentiment, risk = enrich_scores(state.payload)
    state.sentiment = sentiment
    state.risk_score = risk
    state.notes.append("scored")
    return state


def stamp_event(state: EnrichmentState) -> EnrichmentState:
    state.enriched_at = datetime.now(UTC).isoformat()
    state.notes.append("stamped")
    return state


def run_graph(state: EnrichmentState, nodes: list[Node] | None = None) -> EnrichmentState:
    pipeline = nodes or [parse_event, score_event, stamp_event]
    current = state
    for node in pipeline:
        current = node(current)
    return current


def enrich_raw_event(raw: dict[str, Any]) -> dict[str, Any]:
    payload = dict(raw.get("payload") or {})
    state = EnrichmentState(
        event_id=str(raw.get("id", "")),
        source=str(raw.get("source", "unknown")),
        payload=payload,
    )
    result = run_graph(state)

    def pick(key: str, payload_key: str | None = None) -> Any:
        alt = payload_key or key
        if raw.get(key) is not None:
            return raw.get(key)
        return payload.get(alt)

    out: dict[str, Any] = {
        "id": result.event_id,
        "source": result.source,
        "payload": result.payload,
        "sentiment": result.sentiment,
        "risk_score": result.risk_score,
        "enriched_at": result.enriched_at,
        "enrichment_notes": result.notes,
    }

    for key in ("event_type", "actor_id", "actor_name", "title", "repo", "pr_number", "url"):
        value = pick(key)
        if value is not None:
            out[key] = value

    pr_state = pick("pr_state", "state")
    if pr_state is not None:
        out["pr_state"] = pr_state

    return out
