"""End-to-end API smoke test — verifies every Whiteboard endpoint answers.

Mirrors the API portion of the manual checklist in docs/WHITEBOARD_TESTING.md.
Detailed per-endpoint behavior is covered by the other test_*.py files; this is
the single "is the whole API alive?" smoke.
"""


def test_api_smoke(client):
    # 1. health
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"

    # 2. version
    r = client.get("/api/version")
    assert r.status_code == 200 and r.json()["api_version"]

    # 3. whiteboard loads
    r = client.get("/api/whiteboard")
    assert r.status_code == 200 and isinstance(r.json()["blocks"], list)

    # 4. whiteboard saves (PUT)
    r = client.put(
        "/api/whiteboard",
        json={"blocks": [{"id": "b0", "type": "heading", "text": "Smoke", "level": 1}]},
    )
    assert r.status_code == 200 and len(r.json()["blocks"]) == 1

    # 5. writing modes
    r = client.get("/api/writing-modes")
    body = r.json()
    assert r.status_code == 200 and len(body["modes"]) >= 1 and body["default_mode"]

    # 6. outline (derived from the document)
    r = client.get("/api/outline")
    assert r.status_code == 200 and isinstance(r.json()["items"], list)

    # 7. psyke search
    r = client.get("/api/psyke/search", params={"q": "test"})
    assert r.status_code == 200 and isinstance(r.json()["results"], list)

    # 8. logos inline
    r = client.post("/api/logos/inline", json={"action": "suggest", "selection": "test"})
    body = r.json()
    assert r.status_code == 200 and body["ok"] is True and body["output"]
