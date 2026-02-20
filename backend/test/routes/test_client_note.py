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
    assert "created_at" in data


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
        json={"content": "Second note"},
    )

    response = test_client.get(f"/client/{client_id}/note")
    assert response.status_code == 200

    data = response.json()
    assert len(data["data"]) >= 2

    contents = [n["content"] for n in data["data"]]
    assert "First note" in contents
    assert "Second note" in contents


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
