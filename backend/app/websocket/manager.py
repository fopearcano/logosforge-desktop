"""A minimal WebSocket connection manager (broadcast foundation)."""

from __future__ import annotations

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._active: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._active.append(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self._active:
            self._active.remove(websocket)

    async def broadcast(self, message: dict) -> None:
        for websocket in list(self._active):
            try:
                await websocket.send_json(message)
            except Exception:
                self.disconnect(websocket)

    @property
    def count(self) -> int:
        return len(self._active)
