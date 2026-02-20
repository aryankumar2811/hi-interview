from datetime import datetime

from server.shared.pydantic import BaseModel


class PClient(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    assigned_user_id: str | None
    created_at: datetime
    updated_at: datetime


class PClientCreate(BaseModel):
    email: str
    first_name: str
    last_name: str
