from fastapi.testclient import TestClient

from server.data.models.client import Client
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
