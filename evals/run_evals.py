#!/usr/bin/env python3
"""Stage 5 enrichment eval gate — heuristic scorer regression suite."""

from __future__ import annotations

import argparse
import json
import os
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "llm-worker"))

from millipede_llm_worker.enrich import enrich_scores  # noqa: E402


def load_cases() -> list[dict]:
    cases_path = Path(__file__).with_name("enrichment_cases.json")
    return json.loads(cases_path.read_text())


def evaluate_case(case: dict) -> tuple[bool, str]:
    sentiment, risk = enrich_scores(case["payload"])

    if "sentiment_min" in case and sentiment < case["sentiment_min"]:
        return False, f"sentiment {sentiment} < min {case['sentiment_min']}"
    if "sentiment_max" in case and sentiment > case["sentiment_max"]:
        return False, f"sentiment {sentiment} > max {case['sentiment_max']}"
    if "risk_min" in case and risk < case["risk_min"]:
        return False, f"risk {risk} < min {case['risk_min']}"
    if "risk_max" in case and risk > case["risk_max"]:
        return False, f"risk {risk} > max {case['risk_max']}"

    return True, f"sentiment={sentiment:.3f} risk={risk:.3f}"


def write_pass_rate(pass_rate: float) -> None:
    database_url = os.environ.get(
        "DATABASE_URL",
        "postgres://millipede:millipede@localhost:5432/team_radar",
    )
    metric_id = f"eval-{uuid.uuid4()}"

    try:
        import psycopg

        with psycopg.connect(database_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO team_metrics (id, team_id, metric_type, value, computed_at)
                    VALUES (%s, %s, %s, %s, NOW()::TEXT)
                    """,
                    (metric_id, "default", "eval_pass_rate", pass_rate),
                )
            conn.commit()
        print(f"Wrote eval_pass_rate={pass_rate:.3f} to team_metrics ({metric_id})")
        return
    except ImportError:
        pass
    except OSError as err:
        print(f"Postgres write failed: {err}", file=sys.stderr)
        return

    import shutil
    import subprocess

    if shutil.which("psql") is None:
        print(
            "Cannot write team_metrics — install psycopg (`pip install psycopg[binary]`) "
            "or ensure `psql` is on PATH with Postgres running.",
            file=sys.stderr,
        )
        return

    sql = (
        "INSERT INTO team_metrics (id, team_id, metric_type, value, computed_at) "
        f"VALUES ('{metric_id}', 'default', 'eval_pass_rate', {pass_rate}, NOW()::TEXT);"
    )
    result = subprocess.run(
        ["psql", database_url, "-v", "ON_ERROR_STOP=1", "-c", sql],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        print(
            f"psql write failed: {result.stderr.strip() or result.stdout.strip()}",
            file=sys.stderr,
        )
        return

    print(f"Wrote eval_pass_rate={pass_rate:.3f} to team_metrics ({metric_id})")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run enrichment eval gate")
    parser.add_argument(
        "--write-metrics",
        action="store_true",
        help="Persist pass rate to Postgres team_metrics",
    )
    args = parser.parse_args()

    cases = load_cases()
    passed = 0
    for case in cases:
        ok, detail = evaluate_case(case)
        status = "PASS" if ok else "FAIL"
        print(f"[{status}] {case['id']}: {detail}")
        if ok:
            passed += 1

    pass_rate = passed / len(cases) if cases else 0.0
    print(f"\nEval gate: {passed}/{len(cases)} passed ({pass_rate:.0%})")

    if args.write_metrics:
        write_pass_rate(pass_rate)

    return 0 if passed == len(cases) else 1


if __name__ == "__main__":
    raise SystemExit(main())
