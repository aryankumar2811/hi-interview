# List notes for a given client.
from sqlalchemy import select
from sqlalchemy.orm import Session

from server.business.client_note.schema import PClientNote
from server.data.models.client_note import ClientNote


def list_client_notes(session: Session, client_id: str) -> list[PClientNote]:
    notes = (
        session.execute(
            select(ClientNote)
            .where(ClientNote.client_id == client_id)
            .order_by(ClientNote.created_at.desc())
        )
        .scalars()
        .all()
    )
    return [PClientNote.model_validate(note) for note in notes]
