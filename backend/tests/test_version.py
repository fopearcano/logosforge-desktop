def test_version(client):
    resp = client.get("/api/version")
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"]
    assert body["version"]
    assert body["api_version"] == "1.0.0"
    assert body["core_version"] == body["version"]
    assert body["status"]
