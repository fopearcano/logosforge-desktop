# Run the backend test suite.
# Creates the virtual environment + installs dependencies on first run.
# Extra args are passed through to pytest, e.g. .\scripts\test-backend.ps1 -k smoke
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..\backend")

if (-not (Test-Path ".venv")) {
  Write-Host "Creating virtual environment + installing dependencies..."
  python -m venv .venv
  & ".\.venv\Scripts\python.exe" -m pip install --upgrade pip | Out-Null
  & ".\.venv\Scripts\python.exe" -m pip install -r requirements.txt
}

& ".\.venv\Scripts\python.exe" -m pytest @args
