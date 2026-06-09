"""LittleBoy (Billy + Logos) endpoint tests — placeholder mode (no provider)."""


def test_billy_chat_placeholder(client):
    r = client.post(
        "/api/littleboy/billy/chat",
        json={"message": "Help me improve this.", "writing_mode": "screenplay"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert body["conversation_id"]  # generated when not supplied
    assert body["message"]["role"] == "assistant"
    assert "Billy placeholder response" in body["message"]["content"]
    assert body["provider"] == "stub"
    assert body["note"]


def test_billy_chat_keeps_conversation_id(client):
    r = client.post(
        "/api/littleboy/billy/chat",
        json={"message": "Hi", "conversation_id": "conv-123"},
    )
    assert r.json()["conversation_id"] == "conv-123"


def test_billy_chat_includes_context_without_crashing(client):
    r = client.post(
        "/api/littleboy/billy/chat",
        json={
            "message": "Tighten this.",
            "selected_text": "He walked slowly to the door.",
            "nearby_context": "It was a dark night.",
            "writing_mode": "novel",
            "document_title": "Untitled",
            "history": [{"role": "user", "content": "earlier"}, {"role": "assistant", "content": "ok"}],
        },
    )
    assert r.status_code == 200
    assert r.json()["ok"] is True


def test_logos_inline_placeholder_basic(client):
    r = client.post(
        "/api/littleboy/logos/inline",
        json={"action": "rewrite", "selected_text": "hello world", "writing_mode": "novel"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    assert body["action"] == "rewrite"
    assert "Logos placeholder response for action: rewrite" in body["result"]
    assert body["provider"] == "stub"


def test_logos_transform_offers_replacement_when_selected(client):
    r = client.post(
        "/api/littleboy/logos/inline",
        json={"action": "rewrite", "selected_text": "the sea is big"},
    )
    body = r.json()
    # A transform action with a selection proposes a (labelled) replacement → Apply.
    assert body["suggested_replacement"]
    assert "the sea is big" in body["suggested_replacement"]


def test_logos_transform_no_replacement_without_selection(client):
    r = client.post("/api/littleboy/logos/inline", json={"action": "rewrite"})
    assert r.json()["suggested_replacement"] is None


def test_logos_informational_has_no_replacement(client):
    for action in ["explain", "summarize", "suggest"]:
        r = client.post(
            "/api/littleboy/logos/inline",
            json={"action": action, "selected_text": "x"},
        )
        assert r.json()["suggested_replacement"] is None, action


def test_logos_all_actions_respond(client):
    for action in [
        "suggest", "rewrite", "expand", "compress", "explain",
        "improve_dialogue", "improve_action", "make_more_visual", "summarize",
    ]:
        r = client.post(
            "/api/littleboy/logos/inline",
            json={"action": action, "selected_text": "a line of prose"},
        )
        assert r.status_code == 200
        assert r.json()["action"] == action
        assert r.json()["result"]


def test_logos_connect_to_psyke_searches(client):
    # "hero" is an alias of the seeded "Protagonist" entry.
    r = client.post(
        "/api/littleboy/logos/inline",
        json={"action": "connect_to_psyke", "selected_text": "the hero arrives"},
    )
    assert r.status_code == 200
    body = r.json()
    assert "Protagonist" in body["result"]
    assert body["provider"] == "psyke"
    assert body["suggested_replacement"] is None


def test_logos_unknown_action_falls_back(client):
    r = client.post(
        "/api/littleboy/logos/inline",
        json={"action": "obliterate", "selected_text": "x"},
    )
    assert r.json()["action"] == "suggest"
