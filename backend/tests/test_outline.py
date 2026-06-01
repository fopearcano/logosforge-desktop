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
