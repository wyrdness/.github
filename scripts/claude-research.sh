#!/usr/bin/env sh
# Wrapper that installs the Anthropic SDK on first run, then invokes the
# requested research script. Also exposes API_KEY as ANTHROPIC_API_KEY for
# the Node SDK to pick up, so the Makefile can stay vendor-name-free.
set -eu

if [ -n "${API_KEY:-}" ] && [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  ANTHROPIC_API_KEY="$API_KEY"
  export ANTHROPIC_API_KEY
fi

# Install the SDK into the persistent volume only if it isn't already there.
if [ ! -d node_modules/@anthropic-ai/sdk ]; then
  echo "[claude-research] installing @anthropic-ai/sdk..."
  npm install --no-save --silent --no-audit --no-fund @anthropic-ai/sdk@^0.40.0 >/dev/null
fi

mode=${1:-single}
shift || true

SCRIPTS_DIR="$(dirname "$0")"

case "$mode" in
  single)
    exec node "${SCRIPTS_DIR}/claude-research.js" "$@"
    ;;
  batch)
    exec node "${SCRIPTS_DIR}/claude-research-batch.js" "$@"
    ;;
  *)
    echo "usage: claude-research.sh single|batch [args...]" >&2
    exit 2
    ;;
esac
