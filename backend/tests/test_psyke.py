def test_psyke_search_by_name(client):
    r = client.get("/api/psyke/search", params={"q": "protag"})
    assert r.status_code == 200
    body = r.json()
    assert body["query"] == "protag"
    assert "Protagonist" in [e["name"] for e in body["results"]]


def test_psyke_search_by_alias(client):
    # "Hero" is an alias of "Protagonist".
    r = client.get("/api/psyke/search", params={"q": "hero"})
    assert r.status_code == 200
    assert "Protagonist" in [e["name"] for e in r.json()["results"]]


def test_psyke_search_empty_query_returns_nothing(client):
    r = client.get("/api/psyke/search", params={"q": ""})
    assert r.status_code == 200
    assert r.json()["results"] == []


def test_psyke_entry_shape(client):
    r = client.get("/api/psyke/search", params={"q": "city"})
    results = r.json()["results"]
    assert results, "expected a match for 'city'"
    assert {"id", "name", "entry_type", "aliases"} <= set(results[0])
