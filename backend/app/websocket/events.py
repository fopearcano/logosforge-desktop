"""WebSocket events endpoint (/ws/events).

Foundation only: accepts connections, greets with a ``connected`` event, and
echoes/broadcasts inbound messages. Services can later push live events
(e.g. ``whiteboard_changed``) through the shared ``manager``.
"""

from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import settings
from app.websocket.manager import ConnectionManager

router = APIRouter()
manager = ConnectionManager()


@router.websocket("/ws/events")
async def ws_events(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        await websocket.send_json({"event": "connected", "service": settings.app_name})
        while True:
            data = await websocket.receive_text()
            await manager.broadcast({"event": "message", "data": data})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
