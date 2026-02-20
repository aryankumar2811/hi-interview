# Pydantic schemas for client notes.
from datetime import datetime
from typing import Literal

from server.shared.pydantic import BaseModel

NoteCategory = Literal["note", "call", "meeting", "email", "follow_up"]


class PClientNote(BaseModel):
    id: str
    client_id: str
    creator_user_id: str
    creator_name: str
    content: str
    category: NoteCategory
    created_at: datetime


class PClientNoteCreate(BaseModel):
    content: str
    category: NoteCategory = "note"
