# List notes for a given client.
from sqlalchemy import select
from sqlalchemy.orm import Session

from server.business.client_note.schema import PClientNote
from server.data.models.client_note import ClientNote
from server.data.models.user import User


def list_client_notes(session: Session, client_id: str) -> list[PClientNote]:
    rows = (
        session.execute(
            select(ClientNote, User.email)
            .join(User, ClientNote.creator_user_id == User.id)
            .where(ClientNote.client_id == client_id)
            .order_by(ClientNote.created_at.desc())
        )
        .all()
    )
    return [
        PClientNote(
            id=note.id,
            client_id=note.client_id,
            creator_user_id=note.creator_user_id,
            creator_name=email,
            content=note.content,
            category=note.category,
            created_at=note.created_at,
        )
        for note, email in rows
    ]
