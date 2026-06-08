"""Shared fixtures."""

from __future__ import annotations

import os
import tempfile

# Isolate persisted data to a throwaway temp dir BEFORE importing the app, since
# settings (and the whiteboard store path) are resolved at import time. This
# keeps tests from touching the real ~/.logosforge/whiteboard.json.
os.environ["LOGOSFORGE_DATA_DIR"] = tempfile.mkdtemp(prefix="logosforge-test-")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.services.psyke_service import psyke_service  # noqa: E402
from app.services.whiteboard_service import whiteboard_service  # noqa: E402


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def _reset_state():
    """Reset persisted state (document + PSYKE elements) between tests."""
    whiteboard_service.reset()
    psyke_service.reset()
    yield
    whiteboard_service.reset()
    psyke_service.reset()
