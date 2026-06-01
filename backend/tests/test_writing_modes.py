def test_writing_modes(client):
    resp = client.get("/api/writing-modes")
    assert resp.status_code == 200
    body = resp.json()

    ids = [m["id"] for m in body["modes"]]
    assert ids == ["novel", "screenplay", "graphic_novel", "stage_script", "series"]
    assert body["default_mode"] == "novel"

    novel = next(m for m in body["modes"] if m["id"] == "novel")
    assert novel["label"] == "Novel"
    assert "Chapters" in novel["structural_units"]
    assert novel["default_writing_format"] == "novel"
    assert novel["medium_constraints"]
