#!/usr/bin/env bash
set -euo pipefail

# Force commit & push all changes to a branch.
# Usage:
#   ./scripts/git-force-push.sh [branch]
# Defaults:
#   branch = main
# Remote:
#   Uses existing 'origin'. If missing, exits with instructions.
# Notes:
#   Requires that credentials (cached credential helper, GH CLI auth, or PAT env) are already configured.

BRANCH=${1:-main}
COMMIT_MESSAGE=${COMMIT_MESSAGE:-"feat(admin): enterprise admin dashboard (analytics, departments, menu, staff, orders, tables, finance, inventory, settings, layout, overview)"}

if ! command -v git >/dev/null 2>&1; then
  echo "ERROR: git not installed" >&2
  exit 2
fi

if [ ! -d .git ]; then
  echo "Initializing git repository..." >&2
  git init
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "ERROR: No 'origin' remote configured. Add one, e.g.:" >&2
  echo "  git remote add origin <your-repo-url>" >&2
  exit 3
fi

# Configure identity if absent
GIT_USER_NAME=$(git config user.name || true)
GIT_USER_EMAIL=$(git config user.email || true)
[ -z "$GIT_USER_NAME" ] && git config user.name "YayaPOS Bot"
[ -z "$GIT_USER_EMAIL" ] && git config user.email "bot@yaya-pos.local"

echo "Checking out branch $BRANCH" >&2
git checkout -B "$BRANCH"

echo "Staging all changes..." >&2
git add -A || true

if git diff --cached --quiet; then
  echo "No staged changes. Creating an empty commit (ensures push)." >&2
  git commit --allow-empty -m "$COMMIT_MESSAGE" || true
else
  echo "Creating commit..." >&2
  git commit -m "$COMMIT_MESSAGE" || true
fi

echo "Force pushing to origin/$BRANCH ..." >&2
git push -f origin "$BRANCH"

echo "Done. Latest commit:" >&2
git --no-pager log --oneline -1 || true

