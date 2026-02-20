# Fetch a single client by ID.
from sqlalchemy import select
from sqlalchemy.orm import Session

from server.business.client.schema import PClient
from server.data.models.client import Client


def get_client(session: Session, client_id: str) -> PClient | None:
    client = (
        session.execute(select(Client).where(Client.id == client_id))
        .scalars()
        .one_or_none()
    )
    if client is None:
        return None
    return PClient.model_validate(client)
