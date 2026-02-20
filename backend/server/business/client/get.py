# Fetch a single client by ID.
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from server.business.client.schema import PClient
from server.data.models.client import Client
from server.data.models.client_note import ClientNote


def get_client(session: Session, client_id: str) -> PClient | None:
    last_note_subq = (
        select(
            ClientNote.client_id,
            func.max(ClientNote.created_at).label("last_contacted_at"),
        )
        .group_by(ClientNote.client_id)
        .subquery()
    )

    row = (
        session.execute(
            select(Client, last_note_subq.c.last_contacted_at)
            .outerjoin(last_note_subq, Client.id == last_note_subq.c.client_id)
            .where(Client.id == client_id)
        )
        .one_or_none()
    )

    if row is None:
        return None

    client, last_contacted_at = row
    return PClient(
        id=client.id,
        email=client.email,
        first_name=client.first_name,
        last_name=client.last_name,
        assigned_user_id=client.assigned_user_id,
        created_at=client.created_at,
        updated_at=client.updated_at,
        last_contacted_at=last_contacted_at,
    )
