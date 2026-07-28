"""Heuristic and optional LLM-backed enrichment."""

from __future__ import annotations

import json
import os
import re
from typing import Any

POSITIVE = ("opened", "merged", "success", "ship", "approved", "resolved", "green")
NEGATIVE = ("fail", "error", "block", "revert", "incident", "critical", "vuln", "breach")
RISK = ("security", "secret", "password", "cve", "exploit", "malware", "leak", "pii")


def _payload_text(payload: dict[str, Any]) -> str:
    return json.dumps(payload, sort_keys=True).lower()


def heuristic_sentiment(payload: dict[str, Any]) -> float:
    text = _payload_text(payload)
    positive = sum(1 for word in POSITIVE if word in text)
    negative = sum(1 for word in NEGATIVE if word in text)
    if positive == 0 and negative == 0:
        return 0.5
    score = (positive + 1) / (positive + negative + 2)
    return round(max(0.0, min(1.0, score)), 3)


def heuristic_risk(payload: dict[str, Any]) -> float:
    text = _payload_text(payload)
    hits = sum(1 for word in RISK if word in text)
    action = str(payload.get("action", "")).lower()
    if action in {"opened", "reopened"} and "security" in text:
        hits += 1
    score = min(1.0, hits * 0.2)
    return round(score, 3)


def llm_enrich(payload: dict[str, Any]) -> tuple[float, float] | None:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None

    try:
        from openai import OpenAI
    except ImportError:
        return None

    client = OpenAI(api_key=api_key)
    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    prompt = (
        "Score this dev event. Reply with JSON only: "
        '{"sentiment":0-1,"risk_score":0-1}. '
        f"Event: {json.dumps(payload)[:4000]}"
    )
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    content = response.choices[0].message.content or ""
    match = re.search(r"\{.*\}", content, re.DOTALL)
    if not match:
        return None
    parsed = json.loads(match.group())
    return (
        round(float(parsed["sentiment"]), 3),
        round(float(parsed["risk_score"]), 3),
    )


def enrich_scores(payload: dict[str, Any]) -> tuple[float, float]:
    llm = llm_enrich(payload)
    if llm is not None:
        return llm
    return heuristic_sentiment(payload), heuristic_risk(payload)
