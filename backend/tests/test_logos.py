def test_logos_inline_basic(client):
    r = client.post(
        "/api/logos/inline",
        json={"action": "rewrite", "selection": "hello world", "mode": "novel"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert body["action"] == "rewrite"
    assert body["provider"] == "stub"
    assert body["output"]
    assert body["note"]


def test_logos_actions_are_distinct(client):
    outputs = {}
    for action in ["suggest", "rewrite", "expand", "explain", "summarize"]:
        r = client.post(
            "/api/logos/inline",
            json={"action": action, "selection": "the sea", "mode": "screenplay"},
        )
        assert r.status_code == 200
        outputs[action] = r.json()["output"]
    assert len(set(outputs.values())) == len(outputs)


def test_logos_mode_pass_mentions_mode(client):
    r = client.post(
        "/api/logos/inline",
        json={"action": "mode", "selection": "x", "mode": "screenplay"},
    )
    assert "screenplay" in r.json()["output"]


def test_logos_connect_searches_psyke(client):
    # "hero" is an alias of the seeded "Protagonist" entry.
    r = client.post(
        "/api/logos/inline",
        json={"action": "connect", "selection": "the hero arrives"},
    )
    assert r.status_code == 200
    assert "Protagonist" in r.json()["output"]


def test_logos_connect_no_match(client):
    r = client.post(
        "/api/logos/inline",
        json={"action": "connect", "selection": "zzzz qqqq"},
    )
    assert "No PSYKE entries matched" in r.json()["output"]
