# Start the LogosForge Whiteboard backend.
# Creates the virtual environment + installs dependencies on first run.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..\backend")

if (-not (Test-Path ".venv")) {
  Write-Host "Creating virtual environment + installing dependencies..."
  python -m venv .venv
  & ".\.venv\Scripts\python.exe" -m pip install --upgrade pip | Out-Null
  & ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt
}

$port = if ($env:LOGOSFORGE_PORT) { $env:LOGOSFORGE_PORT } else { "8777" }
Write-Host "Starting backend on http://127.0.0.1:$port  (Ctrl+C to stop)..."
& ".\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port $port --reload
