#!/usr/bin/env bash
# Commit and push all tracked + untracked millipede changes (respects .gitignore).
#
# Usage:
#   bash scripts/millipede-commit-push.sh              # auto message from staged files
#   bash scripts/millipede-commit-push.sh "feat: ..."  # explicit message
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "millipede-commit-push: not a git repository" >&2
  exit 1
fi

if ! git symbolic-ref -q HEAD >/dev/null; then
  echo "millipede-commit-push: detached HEAD — checkout a branch first" >&2
  exit 1
fi

REMOTE="origin"
if ! git remote get-url "$REMOTE" >/dev/null 2>&1; then
  REMOTE="$(git remote | head -1 || true)"
  if [[ -z "$REMOTE" ]]; then
    echo "millipede-commit-push: no git remote configured" >&2
    exit 1
  fi
fi

GH_AUTH="${CLAUDE_HOME:-$HOME/.claude}/skills/_shared/gh-auth-for-push.sh"
if [[ -f "$GH_AUTH" ]]; then
  bash "$GH_AUTH" "$REMOTE" || exit 1
fi

upstream_ref() {
  git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true
}

repo_has_changes() {
  ! git diff --quiet \
    || ! git diff --cached --quiet \
    || git ls-files --others --exclude-standard | grep -q .
}

push_pending_commits() {
  local upstream ahead
  upstream="$(upstream_ref)"
  if [[ -z "$upstream" ]]; then
    return 1
  fi

  ahead="$(git rev-list --count "$upstream"..HEAD 2>/dev/null || echo 0)"
  if [[ "$ahead" -eq 0 ]]; then
    return 1
  fi

  echo "millipede-commit-push: pushing $ahead local commit(s)"
  git push
  echo "millipede-commit-push: done"
  exit 0
}

if ! repo_has_changes; then
  push_pending_commits || true
  echo "millipede-commit-push: clean (no-op)"
  exit 0
fi

git add -A

if git diff --cached --quiet; then
  echo "millipede-commit-push: nothing staged after add (no-op)"
  exit 0
fi

if [[ -n "${1:-}" ]]; then
  msg="$1"
else
  count="$(git diff --cached --name-only | wc -l | tr -d ' ')"
  if [[ "$count" -le 8 ]]; then
    summary="$(git diff --cached --name-only | tr '\n' ', ' | sed 's/, $//')"
    msg="chore: sync $summary"
  else
    msg="chore: sync millipede changes ($count files)"
  fi
fi

git commit -m "$msg"
echo "millipede-commit-push: committed — $msg"

git push -u "$REMOTE" HEAD 2>/dev/null || git push
echo "millipede-commit-push: pushed"
echo "millipede-commit-push: done"
