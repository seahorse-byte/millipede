#!/usr/bin/env bash
# Run a command with secrets from 1Password when .env.local.op exists and `op` is on PATH.
# Otherwise run as-is (Node connectors still load .env.local via scripts/connectors/lib/env.mjs).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f "${ROOT}/.env.local.op" ]] && command -v op >/dev/null 2>&1; then
  exec op run --env-file="${ROOT}/.env.local.op" -- "$@"
fi

exec "$@"
