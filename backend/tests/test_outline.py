from app.services.outline_items_service import OutlineItemsService, outline_items_service


def test_outline_empty_document(client):
    resp = client.get("/api/outline")
    assert resp.status_code == 200
    assert resp.json()["items"] == []


def test_outline_derives_from_structural_blocks(client):
    client.post(
        "/api/whiteboard",
        json={
            "title": "S",
            "mode": "novel",
            "blocks": [
                {"id": "b1", "type": "heading", "text": "Chapter 1", "level": 1},
                {"id": "b2", "type": "paragraph", "text": "Once upon a time"},
                {"id": "b3", "type": "scene_heading", "text": "INT. HOUSE - DAY"},
            ],
        },
    )
    resp = client.get("/api/outline")
    assert resp.status_code == 200
    items = resp.json()["items"]
    titles = [i["title"] for i in items]

    assert "Chapter 1" in titles
    assert "INT. HOUSE - DAY" in titles
    # plain prose paragraphs are not outline entries
    assert "Once upon a time" not in titles
    # block_id is carried so the frontend can scroll-to-node
    assert items[0]["block_id"] == "b1"


# --- manual story outliner (GET/PUT /api/outline/items) ---


def test_outline_items_empty_by_default(client):
    r = client.get("/api/outline/items")
    assert r.status_code == 200
    assert r.json()["items"] == []


def test_outline_items_put_then_get(client):
    items = [
        {"id": "n1", "parentId": None, "type": "act", "title": "Act One", "order": 0, "collapsed": False},
        {"id": "n2", "parentId": "n1", "type": "sequence", "title": "Sequence One", "order": 0},
    ]
    r = client.put("/api/outline/items", json={"items": items})
    assert r.status_code == 200
    assert [i["title"] for i in r.json()["items"]] == ["Act One", "Sequence One"]
    # GET returns the same persisted list (incl. nesting via parentId).
    got = client.get("/api/outline/items").json()["items"]
    assert got[1]["parentId"] == "n1"
    assert got[1]["type"] == "sequence"


def test_outline_items_persist_across_restart(client):
    items = [{"id": "n1", "parentId": None, "type": "chapter", "title": "Chapter 1", "order": 0}]
    client.put("/api/outline/items", json={"items": items})
    # A fresh service reading the same file simulates a backend restart.
    reborn = OutlineItemsService(store_path=outline_items_service._path)
    assert [i["title"] for i in reborn.get()] == ["Chapter 1"]


def test_outline_items_replace_overwrites(client):
    client.put("/api/outline/items", json={"items": [{"id": "a", "type": "act", "title": "A"}]})
    client.put("/api/outline/items", json={"items": [{"id": "b", "type": "scene", "title": "B"}]})
    titles = [i["title"] for i in client.get("/api/outline/items").json()["items"]]
    assert titles == ["B"]
