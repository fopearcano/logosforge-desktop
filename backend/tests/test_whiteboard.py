def test_get_default_whiteboard(client):
    resp = client.get("/api/whiteboard")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == "wb_default"
    assert body["mode"] == "novel"
    assert body["blocks"] == []
    assert body["updated_at"]


def test_create_whiteboard(client):
    payload = {
        "title": "My Sheet",
        "mode": "screenplay",
        "blocks": [{"id": "b1", "type": "heading", "text": "Act One", "level": 1}],
    }
    resp = client.post("/api/whiteboard", json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "My Sheet"
    assert body["mode"] == "screenplay"
    assert len(body["blocks"]) == 1
    assert body["blocks"][0]["text"] == "Act One"


def test_create_whiteboard_invalid_mode_falls_back_to_novel(client):
    resp = client.post(
        "/api/whiteboard", json={"title": "X", "mode": "not-a-mode", "blocks": []}
    )
    assert resp.status_code == 201
    assert resp.json()["mode"] == "novel"


def test_update_whiteboard_is_partial(client):
    client.post("/api/whiteboard", json={"title": "A", "mode": "novel", "blocks": []})
    resp = client.put("/api/whiteboard", json={"title": "B"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "B"
    # mode left untouched by a partial update
    assert body["mode"] == "novel"
