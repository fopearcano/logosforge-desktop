"""Smoke tests for placeholder boundaries and the WebSocket foundation."""


def test_psyke_search_returns_contract_shape(client):
    resp = client.get("/api/psyke/search", params={"q": "anything"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["query"] == "anything"
    assert isinstance(body["results"], list)


def test_ws_events_connect(client):
    with client.websocket_connect("/ws/events") as ws:
        msg = ws.receive_json()
        assert msg["event"] == "connected"
        ws.send_text("ping")
        echoed = ws.receive_json()
        assert echoed["event"] == "message"
        assert echoed["data"] == "ping"
