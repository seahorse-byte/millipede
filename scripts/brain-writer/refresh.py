#!/usr/bin/env python3
"""Regenerate Millipede Team Brain docs from analyzer APIs."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_ANALYZER = "http://127.0.0.1:8082"
GENERATED = ROOT / "docs" / "team-brain" / "generated"
VAULT_MIRROR = Path.home() / ".claude" / "millipede-brain"
SOURCE_REGISTRY = ROOT / "config" / "source-registry.json"
STALE_HOURS = 168  # 7 days without events → stale (configurable later)


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso_now() -> str:
    return utc_now().strftime("%Y-%m-%dT%H:%M:%SZ")


def fetch_json(url: str, timeout: float = 10.0) -> tuple[Any | None, str | None]:
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            return json.loads(response.read().decode()), None
    except urllib.error.HTTPError as err:
        return None, f"HTTP {err.code}: {err.reason}"
    except urllib.error.URLError as err:
        return None, str(err.reason)
    except json.JSONDecodeError as err:
        return None, f"invalid JSON: {err}"


def load_registry() -> list[dict]:
    data = json.loads(SOURCE_REGISTRY.read_text())
    return data.get("sources", [])


def source_receipt(
    source: dict,
    metrics: dict | None,
    analyzer_ok: bool,
    synced_at: str,
) -> dict:
    key = source["analyzer_source_key"]
    receipt: dict[str, Any] = {
        "id": source["id"],
        "display_name": source["display_name"],
        "required": source.get("required", True),
        "last_synced_at": synced_at,
        "receipt": "analyzer:/api/metrics/summary",
    }

    if not analyzer_ok:
        receipt["status"] = "blocked"
        receipt["reason"] = "analyzer unreachable"
        return receipt

    if metrics is None:
        receipt["status"] = "blocked"
        receipt["reason"] = "metrics summary unavailable"
        return receipt

    events_by_source = metrics.get("events_by_source", {})
    latest_by_source = metrics.get("latest_by_source", {})
    count = events_by_source.get(key, 0)
    last_event_at = latest_by_source.get(key)

    receipt["event_count"] = count
    if last_event_at:
        receipt["last_event_at"] = last_event_at

    if count == 0:
        receipt["status"] = "empty"
        receipt["reason"] = "no events in analyzer for this source"
    elif last_event_at:
        receipt["status"] = "fresh"
    else:
        receipt["status"] = "stale"
        receipt["reason"] = "events exist but latest_by_source missing"

    return receipt


def overall_status(source_receipts: list[dict]) -> str:
    if any(r["status"] == "blocked" for r in source_receipts):
        return "blocked"
    required = [r for r in source_receipts if r.get("required", True)]
    if any(r["status"] in ("stale", "empty") for r in required):
        return "partial"
    if all(r["status"] == "fresh" for r in required):
        return "fresh"
    return "partial"


def frontmatter(fields: dict) -> str:
    lines = ["---"]
    for key, value in fields.items():
        if isinstance(value, (dict, list)):
            lines.append(f"{key}: {json.dumps(value)}")
        else:
            lines.append(f"{key}: {value}")
    lines.append("---")
    return "\n".join(lines)


def write_source_doc(
    out_dir: Path,
    source: dict,
    receipt: dict,
    events: list[dict],
    synced_at: str,
) -> None:
    source_id = source["id"]
    source_events = [e for e in events if e.get("source") == source_id]
    actors: dict[str, int] = {}
    for event in source_events:
        actor = event.get("actor_name") or event.get("actor_id") or "unknown"
        actors[actor] = actors.get(actor, 0) + 1

    body = [
        frontmatter(
            {
                "doc_type": "source",
                "source_id": source_id,
                "generated_at": synced_at,
                "freshness_status": receipt["status"],
            }
        ),
        "",
        f"# {source['display_name']}",
        "",
        f"**Freshness:** `{receipt['status']}` · **Events:** {receipt.get('event_count', 0)}",
        "",
    ]
    if receipt.get("last_event_at"):
        body.append(f"**Latest event:** {receipt['last_event_at']}")
        body.append("")
    if receipt.get("reason"):
        body.append(f"> {receipt['reason']}")
        body.append("")

    body.extend(["## Recent activity", ""])
    if not source_events:
        body.append("_No recent activity events._")
    else:
        body.append("| Time | Actor | Title | Sentiment | Risk |")
        body.append("|------|-------|-------|-----------|------|")
        for event in source_events[:20]:
            title = (event.get("title") or "—").replace("|", "\\|")
            sentiment = event.get("sentiment")
            risk = event.get("risk_score")
            body.append(
                f"| {event.get('created_at', '—')[:19]} "
                f"| {event.get('actor_name') or '—'} "
                f"| {title} "
                f"| {sentiment if sentiment is not None else '—'} "
                f"| {risk if risk is not None else '—'} |"
            )

    if actors:
        body.extend(["", "## Active actors", ""])
        for actor, count in sorted(actors.items(), key=lambda x: -x[1]):
            body.append(f"- **{actor}** — {count} event(s)")

    (out_dir / "sources" / f"{source_id}.md").write_text("\n".join(body) + "\n")


def write_direct_report_doc(
    out_dir: Path,
    report: dict,
    events: list[dict],
    prs: list[dict],
    synced_at: str,
) -> None:
    rid = report["id"]
    person_events = [e for e in events if e.get("actor_id") == rid]
    person_prs = [p for p in prs if p.get("author_id") == rid]
    open_prs = [p for p in person_prs if p.get("state") == "open"]

    avg_sentiment = None
    avg_risk = None
    sentiments = [e["sentiment"] for e in person_events if e.get("sentiment") is not None]
    risks = [e["risk_score"] for e in person_events if e.get("risk_score") is not None]
    if sentiments:
        avg_sentiment = round(sum(sentiments) / len(sentiments), 3)
    if risks:
        avg_risk = round(sum(risks) / len(risks), 3)

    body = [
        frontmatter(
            {
                "doc_type": "direct_report",
                "direct_report_id": rid,
                "generated_at": synced_at,
                "name": report["name"],
            }
        ),
        "",
        f"# {report['name']}",
        "",
        f"**Email:** {report.get('email', '—')}",
        "",
        "## Snapshot",
        "",
        f"- **Activity events (recent):** {len(person_events)}",
        f"- **Open PRs:** {len(open_prs)}",
    ]
    if avg_sentiment is not None:
        body.append(f"- **Avg sentiment:** {avg_sentiment}")
    if avg_risk is not None:
        body.append(f"- **Avg risk:** {avg_risk}")

    body.extend(["", "## Recent activity", ""])
    if not person_events:
        body.append("_No recent activity._")
    else:
        body.append("| Time | Source | Title | Sentiment | Risk |")
        body.append("|------|--------|-------|-----------|------|")
        for event in person_events[:15]:
            title = (event.get("title") or "—").replace("|", "\\|")
            body.append(
                f"| {event.get('created_at', '—')[:19]} "
                f"| {event.get('source', '—')} "
                f"| {title} "
                f"| {event.get('sentiment', '—')} "
                f"| {event.get('risk_score', '—')} |"
            )

    body.extend(["", "## Pull requests", ""])
    if not person_prs:
        body.append("_No PRs._")
    else:
        body.append("| Repo | # | Title | State | Updated |")
        body.append("|------|---|-------|-------|---------|")
        for pr in person_prs:
            title = (pr.get("title") or "—").replace("|", "\\|")
            link = pr.get("url") or ""
            title_cell = f"[{title}]({link})" if link else title
            body.append(
                f"| {pr.get('repo', '—')} "
                f"| {pr.get('pr_number', '—')} "
                f"| {title_cell} "
                f"| {pr.get('state', '—')} "
                f"| {pr.get('updated_at', '—')[:19]} |"
            )

    body.extend(
        [
            "",
            "## Handles",
            "",
            f"- GitHub: `{report.get('github', '—')}`",
            f"- GitLab: `{report.get('gitlab', '—')}`",
            f"- Slack: `{report.get('slack_user_id', '—')}`",
            f"- Jira: `{report.get('jira_account_id', '—')}`",
        ]
    )

    (out_dir / "direct-reports" / f"{rid}.md").write_text("\n".join(body) + "\n")


def write_pull_requests_doc(out_dir: Path, prs: list[dict], synced_at: str) -> None:
    open_prs = [p for p in prs if p.get("state") == "open"]
    body = [
        frontmatter({"doc_type": "pull_requests", "generated_at": synced_at}),
        "",
        "# Pull requests",
        "",
        f"**Open:** {len(open_prs)} · **Total tracked:** {len(prs)}",
        "",
        "## All PRs / MRs",
        "",
        "| Repo | # | Title | Author | Source | State | Updated |",
        "|------|---|-------|--------|--------|-------|---------|",
    ]
    for pr in prs:
        title = (pr.get("title") or "—").replace("|", "\\|")
        link = pr.get("url") or ""
        title_cell = f"[{title}]({link})" if link else title
        body.append(
            f"| {pr.get('repo', '—')} "
            f"| {pr.get('pr_number', '—')} "
            f"| {title_cell} "
            f"| {pr.get('author_name') or '—'} "
            f"| {pr.get('source', '—')} "
            f"| {pr.get('state', '—')} "
            f"| {pr.get('updated_at', '—')[:19]} |"
        )

    (out_dir / "pull-requests.md").write_text("\n".join(body) + "\n")


def write_index(
    out_dir: Path,
    metrics: dict | None,
    receipts: list[dict],
    reports: list[dict],
    overall: str,
    synced_at: str,
    analyzer_url: str,
) -> None:
    kpis = (metrics or {}).get("kpis", {})
    body = [
        frontmatter(
            {
                "doc_type": "index",
                "generated_at": synced_at,
                "overall_freshness": overall,
                "analyzer_url": analyzer_url,
            }
        ),
        "",
        "# Millipede Team Brain",
        "",
        f"**Generated:** {synced_at} · **Overall freshness:** `{overall}`",
        "",
        "## Team KPIs",
        "",
    ]
    if metrics:
        body.extend(
            [
                f"- **Total events:** {metrics.get('total_events', 0)}",
                f"- **Avg sentiment:** {kpis.get('avg_sentiment', '—')}",
                f"- **High risk count:** {kpis.get('high_risk_count', '—')}",
                f"- **Friction index:** {kpis.get('friction_index', '—')}",
                f"- **Eval pass rate:** {kpis.get('eval_pass_rate', '—')}",
                "",
            ]
        )
    else:
        body.append("_Analyzer metrics unavailable._\n")

    body.extend(["## Source freshness", "", "| Source | Status | Events | Latest event |", "|--------|--------|--------|--------------|"])
    for receipt in receipts:
        body.append(
            f"| {receipt['display_name']} "
            f"| `{receipt['status']}` "
            f"| {receipt.get('event_count', '—')} "
            f"| {receipt.get('last_event_at', '—')} |"
        )

    body.extend(["", "## Direct reports", ""])
    for report in reports:
        body.append(f"- [{report['name']}](direct-reports/{report['id']}.md)")

    body.extend(["", "## Sources", ""])
    for receipt in receipts:
        sid = receipt["id"]
        body.append(f"- [{receipt['display_name']}](sources/{sid}.md)")

    body.extend(
        [
            "",
            "## Other",
            "",
            "- [Pull requests](pull-requests.md)",
            "- [brain-state.json](brain-state.json) — machine-readable receipts",
            "",
            "---",
            "",
            "Refresh: `pnpm brain:refresh` · Plan: `~/.claude/plans/millipede-living-team-brain.md`",
        ]
    )

    (out_dir / "README.md").write_text("\n".join(body) + "\n")


def mirror_to_vault(generated: Path) -> None:
    if not generated.exists():
        return
    VAULT_MIRROR.mkdir(parents=True, exist_ok=True)
    for item in generated.iterdir():
        dest = VAULT_MIRROR / item.name
        if item.is_dir():
            if dest.exists():
                shutil.rmtree(dest)
            shutil.copytree(item, dest)
        else:
            shutil.copy2(item, dest)


def main() -> int:
    parser = argparse.ArgumentParser(description="Refresh Millipede Team Brain docs")
    parser.add_argument(
        "--analyzer-url",
        default=os.environ.get("ANALYZER_URL", DEFAULT_ANALYZER),
        help="Analyzer base URL (default: %(default)s)",
    )
    parser.add_argument("--no-mirror", action="store_true", help="Skip vault mirror")
    parser.add_argument("--events-limit", type=int, default=100)
    parser.add_argument("--prs-limit", type=int, default=100)
    args = parser.parse_args()

    base = args.analyzer_url.rstrip("/")
    synced_at = iso_now()
    refresh_id = f"refresh-{synced_at.replace(':', '').replace('-', '')}"

    health, health_err = fetch_json(f"{base}/health")
    analyzer_ok = health is not None and health.get("status") == "ok"

    metrics, metrics_err = fetch_json(f"{base}/api/metrics/summary") if analyzer_ok else (None, health_err)
    reports, _ = fetch_json(f"{base}/api/direct-reports") if analyzer_ok else ([], None)
    events, _ = (
        fetch_json(f"{base}/api/events?limit={args.events_limit}") if analyzer_ok else ([], None)
    )
    prs, _ = (
        fetch_json(f"{base}/api/pull-requests?limit={args.prs_limit}") if analyzer_ok else ([], None)
    )

    reports = reports or []
    events = events or []
    prs = prs or []

    registry = load_registry()
    receipts = [
        source_receipt(source, metrics, analyzer_ok, synced_at) for source in registry
    ]
    overall = overall_status(receipts)

    out_dir = GENERATED
    (out_dir / "direct-reports").mkdir(parents=True, exist_ok=True)
    (out_dir / "sources").mkdir(parents=True, exist_ok=True)

    for source, receipt in zip(registry, receipts):
        write_source_doc(out_dir, source, receipt, events, synced_at)

    for report in reports:
        write_direct_report_doc(out_dir, report, events, prs, synced_at)

    write_pull_requests_doc(out_dir, prs, synced_at)
    write_index(out_dir, metrics, receipts, reports, overall, synced_at, base)

    brain_state = {
        "refresh_id": refresh_id,
        "generated_at": synced_at,
        "overall_status": overall,
        "analyzer": {
            "url": base,
            "status": "ok" if analyzer_ok else "blocked",
            "error": health_err or metrics_err,
            "database": (health or {}).get("database"),
            "redis": (health or {}).get("redis"),
        },
        "sources": {r["id"]: r for r in receipts},
    }
    (out_dir / "brain-state.json").write_text(json.dumps(brain_state, indent=2) + "\n")

    if not args.no_mirror:
        mirror_to_vault(out_dir)

    print(f"Team Brain refreshed → {out_dir} (overall: {overall})")
    if not args.no_mirror:
        print(f"Vault mirror → {VAULT_MIRROR}")

    return 0 if overall != "blocked" else 1


if __name__ == "__main__":
    sys.exit(main())
