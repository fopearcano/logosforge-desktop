"""Persistence: the whiteboard document survives backend reinitialization."""

from app.schemas.whiteboard import WhiteboardBlock, WhiteboardUpdate
from app.services.whiteboard_service import WhiteboardService, whiteboard_service


def test_get_returns_initial_content(client):
    r = client.get("/api/whiteboard")
    assert r.status_code == 200
    assert r.json()["blocks"] == []


def test_put_then_get_returns_saved_content(client):
    client.put(
        "/api/whiteboard",
        json={"blocks": [{"id": "b0", "type": "paragraph", "text": "remember me"}]},
    )
    r = client.get("/api/whiteboard")
    assert r.json()["blocks"][0]["text"] == "remember me"


def test_put_writes_to_disk_and_reloads(client):
    client.put(
        "/api/whiteboard",
        json={"blocks": [{"id": "b0", "type": "paragraph", "text": "on disk"}]},
    )
    # A fresh service at the same path loads the saved content — i.e. the data
    # survives a backend/Electron restart.
    reloaded = WhiteboardService(store_path=whiteboard_service._path)
    assert reloaded.get().blocks[0].text == "on disk"


def test_persistence_survives_reinitialization(tmp_path):
    path = tmp_path / "whiteboard.json"
    first = WhiteboardService(store_path=path)
    first.update(
        WhiteboardUpdate(blocks=[WhiteboardBlock(id="b0", type="paragraph", text="persisted")])
    )
    assert path.exists()
    second = WhiteboardService(store_path=path)  # simulate a restart
    assert second.get().blocks[0].text == "persisted"


def test_mode_persists(tmp_path):
    path = tmp_path / "whiteboard.json"
    WhiteboardService(store_path=path).update(WhiteboardUpdate(mode="screenplay"))
    assert WhiteboardService(store_path=path).get().mode == "screenplay"


def test_screenplay_element_persists(tmp_path):
    path = tmp_path / "whiteboard.json"
    svc = WhiteboardService(store_path=path)
    svc.update(
        WhiteboardUpdate(
            blocks=[WhiteboardBlock(id="b0", type="paragraph", text="JOHN", sp="character")]
        )
    )
    assert WhiteboardService(store_path=path).get().blocks[0].sp == "character"
