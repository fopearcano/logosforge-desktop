"""Smoke tests for the placeholder boundaries (PSYKE search, Logos inline)
and the WebSocket foundation. Not required by the milestone, but cheap insurance
that the stubs answer with the agreed contract shapes."""


def test_psyke_search_returns_contract_shape(client):
    resp = client.get("/api/psyke/search", params={"q": "anything"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["query"] == "anything"
    assert isinstance(body["results"], list)


def test_logos_inline_stub(client):
    resp = client.post(
        "/api/logos/inline", json={"action": "rewrite", "selection": "hello world"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["ok"] is True
    assert body["action"] == "rewrite"
    assert body["provider"] == "stub"
    assert "hello world" in body["output"]


def test_ws_events_connect(client):
    with client.websocket_connect("/ws/events") as ws:
        msg = ws.receive_json()
        assert msg["event"] == "connected"
        ws.send_text("ping")
        echoed = ws.receive_json()
        assert echoed["event"] == "message"
        assert echoed["data"] == "ping"
