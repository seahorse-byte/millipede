#!/usr/bin/env bash
# Launch the Millipede demo in tmux — see docs/millipede-playbook.md
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SESSION="millipede"

if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Session '$SESSION' already exists — attach with: tmux attach -t $SESSION"
  echo "Playbook: docs/millipede-playbook.md"
  exit 0
fi

cd "$ROOT"

print_banner() {
  cat <<'BANNER'

╔══════════════════════════════════════════════════════════════╗
║  Millipede demo — tmux session "millipede"                   ║
╠══════════════════════════════════════════════════════════════╣
║  WINDOW pipeline                                             ║
║    compose      → pnpm compose:up + Kafka topics             ║
║    ingestion    → :8081 webhooks → raw-dev-events            ║
║    llm-worker   → enrich → enriched-dev-events               ║
║    analyzer     → :8082 Postgres + Redis + /api              ║
║  WINDOW ui                                                   ║
║    radar        → http://127.0.0.1:5174 (after health OK)    ║
║    tests        → curl cheat sheet when Ready                ║
╠══════════════════════════════════════════════════════════════╣
║  Wait for "Ready" in test shell before firing webhooks.      ║
║  Playbook: docs/millipede-playbook.md                        ║
╚══════════════════════════════════════════════════════════════╝

BANNER
}

print_banner

tmux new-session -d -s "$SESSION" -n pipeline -c "$ROOT"
tmux send-keys -t "$SESSION:pipeline.0" \
  'echo "=== PANE: compose ===" && pnpm compose:down && pnpm compose:up && bash scripts/wait-for-kafka.sh && echo && docker ps' C-m

tmux split-window -h -t "$SESSION:pipeline.0" -c "$ROOT"
tmux send-keys -t "$SESSION:pipeline.1" \
  'echo "=== PANE: ingestion (:8081) ===" && bash scripts/wait-for-kafka.sh && pnpm ingestion:dev' C-m

tmux select-pane -t "$SESSION:pipeline.0"
tmux split-window -v -c "$ROOT"
tmux send-keys -t "$SESSION:pipeline.2" \
  'echo "=== PANE: llm-worker ===" && bash scripts/wait-for-kafka.sh && pnpm llm-worker:dev' C-m

tmux select-pane -t "$SESSION:pipeline.1"
tmux split-window -v -c "$ROOT"
tmux send-keys -t "$SESSION:pipeline.3" \
  'echo "=== PANE: analyzer (:8082) ===" && bash scripts/wait-for-kafka.sh && pnpm analyzer:dev' C-m

tmux select-pane -t "$SESSION:pipeline.0" -T compose
tmux select-pane -t "$SESSION:pipeline.1" -T ingestion
tmux select-pane -t "$SESSION:pipeline.2" -T llm-worker
tmux select-pane -t "$SESSION:pipeline.3" -T analyzer

tmux new-window -t "$SESSION" -n ui -c "$ROOT"
tmux send-keys -t "$SESSION:ui.0" \
  'echo "=== PANE: radar UI ===" && bash scripts/wait-for-health.sh && pnpm dev:radar' C-m

tmux split-window -v -c "$ROOT"
tmux send-keys -t "$SESSION:ui.1" \
  'echo "=== PANE: test shell ===" && bash scripts/wait-for-health.sh && cat <<EOF

Ready. Open http://127.0.0.1:5174/

Health:
  curl -s http://127.0.0.1:8082/health | jq "{redis, database}"

Fire webhook (expect kafka_status: published):
  curl -s -X POST http://127.0.0.1:8081/webhooks/hello \\
    -H "Content-Type: application/json" \\
    -d "{\"action\":\"opened\",\"source\":\"github\",\"title\":\"ship feature for demo\"}" | jq .

Seed demo data (5 devs × 4 sources + cross-repo PRs):
  pnpm seed:demo

Stage 5 quality:
  pnpm evals:run
  pnpm evals:write-metrics

EOF
' C-m

tmux select-pane -t "$SESSION:ui.0" -T radar
tmux select-pane -t "$SESSION:ui.1" -T tests

tmux select-window -t "$SESSION:ui"
echo "Started tmux session '$SESSION'"
echo "  window pipeline — compose | ingestion / llm-worker | analyzer"
echo "  window ui       — radar :5174 | test shell"
echo ""
echo "Attach:  tmux attach -t $SESSION"
echo "Playbook: docs/millipede-playbook.md"
echo "Replay:   docs/millipede-demo-replay.md"

tmux attach -t "$SESSION"
