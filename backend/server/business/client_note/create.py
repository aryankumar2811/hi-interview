# Create a new note on a client.
from sqlalchemy.orm import Session

from server.business.client_note.schema import PClientNote, PClientNoteCreate
from server.data.models.client_note import ClientNote


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
    )
    session.add(note)
    session.commit()
    session.refresh(note)
    return PClientNote.model_validate(note)
