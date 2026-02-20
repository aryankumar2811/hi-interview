# Tests for client note endpoints.
from fastapi.testclient import TestClient

from server.data.models.client import Client
from server.shared.databasemanager import DatabaseManager


def _create_client(database: DatabaseManager, email: str) -> str:
    with database.create_session() as session:
        client = Client(email=email, first_name="Note", last_name="Test")
        session.add(client)
        session.commit()
        return client.id


def test_create_note(
    test_client: TestClient, database: DatabaseManager
) -> None:
    client_id = _create_client(database, "note-create@example.com")

    response = test_client.post(
        f"/client/{client_id}/note",
        json={"content": "Had a great call today."},
    )
    assert response.status_code == 200

    data = response.json()
    assert data["content"] == "Had a great call today."
    assert data["client_id"] == client_id
    assert "creator_user_id" in data
    assert data["creator_name"] == "testuser@example.com"
    assert data["category"] == "note"
    assert "created_at" in data


def test_create_note_with_category(
    test_client: TestClient, database: DatabaseManager
) -> None:
    client_id = _create_client(database, "note-category@example.com")

    response = test_client.post(
        f"/client/{client_id}/note",
        json={"content": "Had a call with client.", "category": "call"},
    )
    assert response.status_code == 200

    data = response.json()
    assert data["content"] == "Had a call with client."
    assert data["category"] == "call"


def test_create_note_invalid_category(
    test_client: TestClient, database: DatabaseManager
) -> None:
    client_id = _create_client(database, "note-bad-cat@example.com")

    response = test_client.post(
        f"/client/{client_id}/note",
        json={"content": "Bad category.", "category": "invalid"},
    )
    assert response.status_code == 422


def test_list_notes(
    test_client: TestClient, database: DatabaseManager
) -> None:
    client_id = _create_client(database, "note-list@example.com")

    test_client.post(
        f"/client/{client_id}/note",
        json={"content": "First note"},
    )
    test_client.post(
        f"/client/{client_id}/note",
        json={"content": "Second note", "category": "meeting"},
    )

    response = test_client.get(f"/client/{client_id}/note")
    assert response.status_code == 200

    data = response.json()
    assert len(data["data"]) >= 2

    by_content = {n["content"]: n for n in data["data"]}
    assert by_content["First note"]["category"] == "note"
    assert by_content["Second note"]["category"] == "meeting"

    for note in data["data"]:
        assert note["creator_name"] == "testuser@example.com"


def test_list_notes_empty(
    test_client: TestClient, database: DatabaseManager
) -> None:
    client_id = _create_client(database, "note-empty@example.com")

    response = test_client.get(f"/client/{client_id}/note")
    assert response.status_code == 200
    assert response.json()["data"] == []


def test_create_note_unauthenticated(
    unauthenticated_test_client: TestClient, database: DatabaseManager
) -> None:
    client_id = _create_client(database, "note-unauth@example.com")

    response = unauthenticated_test_client.post(
        f"/client/{client_id}/note",
        json={"content": "Should fail"},
    )
    assert response.status_code == 401


def test_list_notes_unauthenticated(
    unauthenticated_test_client: TestClient, database: DatabaseManager
) -> None:
    client_id = _create_client(database, "note-unauth-list@example.com")

    response = unauthenticated_test_client.get(f"/client/{client_id}/note")
    assert response.status_code == 401
