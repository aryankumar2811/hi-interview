from fastapi.testclient import TestClient

from server.data.models.client import Client
from server.data.models.client_note import ClientNote
from server.shared.databasemanager import DatabaseManager


def test_list_clients(test_client: TestClient, database: DatabaseManager) -> None:
    with database.create_session() as session:
        session.add(Client(email="alice@example.com", first_name="Alice", last_name="Smith"))
        session.add(Client(email="bob@example.com", first_name="Bob", last_name="Jones"))
        session.commit()

    response = test_client.get("/client")
    assert response.status_code == 200

    data = response.json()
    assert len(data["data"]) >= 2

    emails = [c["email"] for c in data["data"]]
    assert "alice@example.com" in emails
    assert "bob@example.com" in emails


def test_list_clients_unauthenticated(unauthenticated_test_client: TestClient) -> None:
    response = unauthenticated_test_client.get("/client")
    assert response.status_code == 401


def test_list_clients_with_assigned_user(
    test_client: TestClient, database: DatabaseManager, user_id: str
) -> None:
    with database.create_session() as session:
        session.add(
            Client(
                email="assigned@example.com",
                first_name="Charlie",
                last_name="Brown",
                assigned_user_id=user_id,
            )
        )
        session.commit()

    response = test_client.get("/client")
    assert response.status_code == 200

    data = response.json()
    assigned = [c for c in data["data"] if c["email"] == "assigned@example.com"]
    assert len(assigned) == 1
    assert assigned[0]["assigned_user_id"] == user_id


def test_get_client(test_client: TestClient, database: DatabaseManager) -> None:
    with database.create_session() as session:
        client = Client(
            email="detail@example.com", first_name="Dana", last_name="White"
        )
        session.add(client)
        session.commit()
        client_id = client.id

    response = test_client.get(f"/client/{client_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["id"] == client_id
    assert data["email"] == "detail@example.com"
    assert data["first_name"] == "Dana"
    assert data["last_name"] == "White"


def test_get_client_not_found(test_client: TestClient) -> None:
    response = test_client.get("/client/nonexistent-id")
    assert response.status_code == 404


def test_get_client_unauthenticated(
    unauthenticated_test_client: TestClient, database: DatabaseManager
) -> None:
    with database.create_session() as session:
        client = Client(
            email="unauth-detail@example.com",
            first_name="Eve",
            last_name="Black",
        )
        session.add(client)
        session.commit()
        client_id = client.id

    response = unauthenticated_test_client.get(f"/client/{client_id}")
    assert response.status_code == 401


def test_create_client(test_client: TestClient) -> None:
    response = test_client.post(
        "/client",
        json={
            "email": "new@example.com",
            "first_name": "Frank",
            "last_name": "Green",
        },
    )
    assert response.status_code == 200

    data = response.json()
    assert data["email"] == "new@example.com"
    assert data["first_name"] == "Frank"
    assert data["last_name"] == "Green"
    assert "id" in data


def test_create_client_duplicate_email(test_client: TestClient) -> None:
    test_client.post(
        "/client",
        json={
            "email": "duplicate@example.com",
            "first_name": "Dup",
            "last_name": "One",
        },
    )
    response = test_client.post(
        "/client",
        json={
            "email": "duplicate@example.com",
            "first_name": "Dup",
            "last_name": "Two",
        },
    )
    assert response.status_code == 409


def test_create_client_unauthenticated(
    unauthenticated_test_client: TestClient,
) -> None:
    response = unauthenticated_test_client.post(
        "/client",
        json={
            "email": "unauth-create@example.com",
            "first_name": "No",
            "last_name": "Auth",
        },
    )
    assert response.status_code == 401


def test_get_client_last_contacted_at_with_notes(
    test_client: TestClient, database: DatabaseManager, user_id: str
) -> None:
    with database.create_session() as session:
        client = Client(
            email="contacted@example.com", first_name="Grace", last_name="Lee"
        )
        session.add(client)
        session.flush()
        note1 = ClientNote(
            client_id=client.id, creator_user_id=user_id, content="First note"
        )
        note2 = ClientNote(
            client_id=client.id, creator_user_id=user_id, content="Second note"
        )
        session.add(note1)
        session.add(note2)
        session.commit()
        client_id = client.id

    response = test_client.get(f"/client/{client_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["last_contacted_at"] is not None


def test_get_client_last_contacted_at_without_notes(
    test_client: TestClient, database: DatabaseManager
) -> None:
    with database.create_session() as session:
        client = Client(
            email="no-contact@example.com", first_name="Hank", last_name="Hill"
        )
        session.add(client)
        session.commit()
        client_id = client.id

    response = test_client.get(f"/client/{client_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["last_contacted_at"] is None


def test_list_clients_last_contacted_at(
    test_client: TestClient, database: DatabaseManager, user_id: str
) -> None:
    with database.create_session() as session:
        client_with = Client(
            email="list-contacted@example.com", first_name="Ivy", last_name="Chen"
        )
        client_without = Client(
            email="list-no-contact@example.com", first_name="Jack", last_name="Doe"
        )
        session.add(client_with)
        session.add(client_without)
        session.flush()
        session.add(
            ClientNote(
                client_id=client_with.id, creator_user_id=user_id, content="A note"
            )
        )
        session.commit()

    response = test_client.get("/client")
    assert response.status_code == 200

    data = response.json()
    by_email = {c["email"]: c for c in data["data"]}
    assert by_email["list-contacted@example.com"]["last_contacted_at"] is not None
    assert by_email["list-no-contact@example.com"]["last_contacted_at"] is None
