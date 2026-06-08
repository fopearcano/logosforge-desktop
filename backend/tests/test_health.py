def test_health_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["service"]


def test_health_reports_version_compat(client):
    # /health carries version/compat fields (synced with StoryPlanner) so a shared
    # client can verify compatibility from a single call.
    body = client.get("/health").json()
    assert body["api_version"] == "1.0.0"
    assert body["version"]
    assert body["core_version"] == body["version"]
