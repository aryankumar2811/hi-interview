# Pydantic schemas for client notes.
from datetime import datetime

from server.shared.pydantic import BaseModel


class PClientNote(BaseModel):
    id: str
    client_id: str
    creator_user_id: str
    content: str
    created_at: datetime


class PClientNoteCreate(BaseModel):
    content: str
