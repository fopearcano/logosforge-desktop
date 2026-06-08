import pytest

from app.schemas.psyke import ALLOWED_TYPES
from app.services.psyke_service import PsykeService, psyke_service


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


def test_psyke_search_by_type(client):
    r = client.get("/api/psyke/search", params={"q": "character"})
    names = [e["name"] for e in r.json()["results"]]
    assert "Protagonist" in names and "Antagonist" in names


def test_psyke_search_empty_query_returns_nothing(client):
    r = client.get("/api/psyke/search", params={"q": ""})
    assert r.status_code == 200
    assert r.json()["results"] == []


def test_psyke_entry_shape(client):
    r = client.get("/api/psyke/search", params={"q": "city"})
    results = r.json()["results"]
    assert results, "expected a match for 'city'"
    assert {"id", "name", "entry_type", "aliases"} <= set(results[0])


def test_create_character_and_find_by_name_description_notes(client):
    r = client.post(
        "/api/psyke/elements",
        json={
            "type": "character",
            "name": "Zampanò",
            "description": "Maltese dog protagonist",
            "notes": "Test character",
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["ok"] is True
    el = body["element"]
    assert el["name"] == "Zampanò"
    assert el["entry_type"] == "character"
    assert el["id"] and el["created_at"] and el["updated_at"]

    def names(q):
        return [e["name"] for e in client.get("/api/psyke/search", params={"q": q}).json()["results"]]

    assert "Zampanò" in names("Zampanò")  # by name
    assert "Zampanò" in names("maltese")  # by description
    assert "Zampanò" in names("test character")  # by notes


@pytest.mark.parametrize("etype", sorted(ALLOWED_TYPES))
def test_create_each_allowed_type(client, etype):
    r = client.post("/api/psyke/elements", json={"type": etype, "name": f"Sample {etype}"})
    assert r.status_code == 200
    assert r.json()["element"]["entry_type"] == etype


def test_create_unknown_type_falls_back_to_other(client):
    r = client.post("/api/psyke/elements", json={"type": "weapon", "name": "Sword"})
    assert r.status_code == 200
    assert r.json()["element"]["entry_type"] == "other"


def test_create_requires_a_name(client):
    r = client.post("/api/psyke/elements", json={"type": "other", "name": ""})
    assert r.status_code == 422


def test_get_element_by_id(client):
    el = client.post(
        "/api/psyke/elements", json={"type": "place", "name": "Constantinople"}
    ).json()["element"]
    r = client.get(f"/api/psyke/elements/{el['id']}")
    assert r.status_code == 200
    assert r.json()["element"]["name"] == "Constantinople"
    assert client.get("/api/psyke/elements/does-not-exist").status_code == 404


def test_created_element_persists_across_restart(client):
    client.post("/api/psyke/elements", json={"type": "place", "name": "Constantinople"})
    # A fresh service reading the same file simulates a backend restart.
    reborn = PsykeService(store_path=psyke_service._path)
    assert "Constantinople" in [e.name for e in reborn.search("constantinople")]
