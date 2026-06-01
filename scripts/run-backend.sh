#!/usr/bin/env bash
# Start the LogosForge Whiteboard backend.
# Creates the virtual environment + installs dependencies on first run.
set -euo pipefail
cd "$(dirname "$0")/../backend"

if [ ! -d .venv ]; then
  echo "Creating virtual environment + installing dependencies…"
  python3 -m venv .venv
  ./.venv/bin/python -m pip install --upgrade pip >/dev/null
  ./.venv/bin/python -m pip install -r requirements.txt
fi

PORT="${LOGOSFORGE_PORT:-8777}"
echo "Starting backend on http://127.0.0.1:${PORT}  (Ctrl+C to stop)…"
exec ./.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port "${PORT}" --reload
