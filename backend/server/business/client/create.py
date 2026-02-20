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
    return PClient(
        id=client.id,
        email=client.email,
        first_name=client.first_name,
        last_name=client.last_name,
        assigned_user_id=client.assigned_user_id,
        created_at=client.created_at,
        updated_at=client.updated_at,
        last_contacted_at=None,
    )
