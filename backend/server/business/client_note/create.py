# Create a new note on a client.
from sqlalchemy import select
from sqlalchemy.orm import Session

from server.business.client_note.schema import PClientNote, PClientNoteCreate
from server.data.models.client_note import ClientNote
from server.data.models.user import User


def create_client_note(
    session: Session,
    client_id: str,
    creator_user_id: str,
    data: PClientNoteCreate,
) -> PClientNote:
    note = ClientNote(
        client_id=client_id,
        creator_user_id=creator_user_id,
        content=data.content,
        category=data.category,
    )
    session.add(note)
    session.commit()
    session.refresh(note)

    creator_email = (
        session.execute(select(User.email).where(User.id == creator_user_id))
        .scalar_one()
    )

    return PClientNote(
        id=note.id,
        client_id=note.client_id,
        creator_user_id=note.creator_user_id,
        creator_name=creator_email,
        content=note.content,
        category=note.category,
        created_at=note.created_at,
    )
