# Create a new client record.
from sqlalchemy.orm import Session

from server.business.client.schema import PClient, PClientCreate
from server.data.models.client import Client


def create_client(session: Session, data: PClientCreate) -> PClient:
    client = Client(
        email=data.email.lower(),
        first_name=data.first_name,
        last_name=data.last_name,
    )
    session.add(client)
    session.commit()
    session.refresh(client)
    return PClient.model_validate(client)
