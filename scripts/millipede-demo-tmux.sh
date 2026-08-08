#!/usr/bin/env bash
# Launch the Millipede demo in tmux — see docs/millipede-demo-replay.md
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SESSION="millipede"

if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Session '$SESSION' already exists — attach with: tmux attach -t $SESSION"
  exit 0
fi

cd "$ROOT"

tmux new-session -d -s "$SESSION" -n pipeline -c "$ROOT"
tmux send-keys -t "$SESSION:pipeline.0" \
  'echo "=== PANE: compose ===" && pnpm compose:down && pnpm compose:up && echo && docker ps' C-m

tmux split-window -h -t "$SESSION:pipeline.0" -c "$ROOT"
tmux send-keys -t "$SESSION:pipeline.1" \
  'echo "=== PANE: ingestion (:8081) ===" && sleep 25 && pnpm ingestion:dev' C-m

tmux select-pane -t "$SESSION:pipeline.0"
tmux split-window -v -c "$ROOT"
tmux send-keys -t "$SESSION:pipeline.2" \
  'echo "=== PANE: llm-worker ===" && sleep 30 && pnpm llm-worker:dev' C-m

tmux select-pane -t "$SESSION:pipeline.1"
tmux split-window -v -c "$ROOT"
tmux send-keys -t "$SESSION:pipeline.3" \
  'echo "=== PANE: analyzer (:8082) ===" && sleep 35 && pnpm analyzer:dev' C-m

tmux select-pane -t "$SESSION:pipeline.0" -T compose
tmux select-pane -t "$SESSION:pipeline.1" -T ingestion
tmux select-pane -t "$SESSION:pipeline.2" -T llm-worker
tmux select-pane -t "$SESSION:pipeline.3" -T analyzer

tmux new-window -t "$SESSION" -n ui -c "$ROOT"
tmux send-keys -t "$SESSION:ui.0" \
  'echo "=== PANE: radar UI ===" && pnpm dev:radar' C-m

tmux split-window -v -c "$ROOT"
tmux send-keys -t "$SESSION:ui.1" \
  'echo "=== PANE: test shell ===" && sleep 40 && cat <<EOF

Ready. Open http://localhost:5174/

Health:
  curl -s http://localhost:8082/health | jq "{redis, database}"

Fire webhook:
  curl -s -X POST http://localhost:8081/webhooks/hello \\
    -H "Content-Type: application/json" \\
    -d "{\"action\":\"opened\",\"source\":\"github\",\"title\":\"ship feature for demo\"}" | jq .

Stage 5 quality:
  pnpm evals:run
  pnpm evals:write-metrics    # → Eval pass rate KPI on dashboard

EOF
' C-m

tmux select-pane -t "$SESSION:ui.0" -T radar
tmux select-pane -t "$SESSION:ui.1" -T tests

tmux select-window -t "$SESSION:ui"
echo "Started tmux session '$SESSION'"
echo "  window pipeline — compose | ingestion / llm-worker | analyzer"
echo "  window ui       — radar :5174 | test shell"
echo ""
echo "Attach: tmux attach -t $SESSION"
echo "Guide:  docs/millipede-demo-replay.md"

tmux attach -t "$SESSION"
