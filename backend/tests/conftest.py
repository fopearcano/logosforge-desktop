"""Shared pytest fixtures."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.whiteboard_service import whiteboard_service


@pytest.fixture()
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def _reset_state():
    """Keep the in-memory document isolated between tests."""
    whiteboard_service.reset()
    yield
    whiteboard_service.reset()
