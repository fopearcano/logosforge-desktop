#!/usr/bin/env bash
# Run the backend test suite.
# Creates the virtual environment + installs dependencies on first run.
# Extra args are passed through to pytest, e.g. scripts/test-backend.sh -k smoke
set -euo pipefail
cd "$(dirname "$0")/../backend"

if [ ! -d .venv ]; then
  echo "Creating virtual environment + installing dependencies…"
  python3 -m venv .venv
  ./.venv/bin/python -m pip install --upgrade pip >/dev/null
  ./.venv/bin/python -m pip install -r requirements.txt
fi

exec ./.venv/bin/python -m pytest "$@"
