# Routes for client notes (list and create).
from fastapi import APIRouter

from server.business.auth.auth_verifier import AuthVerifier
from server.business.auth.schema import UserTokenInfo
from server.business.client_note.create import create_client_note
from server.business.client_note.list import list_client_notes
from server.business.client_note.schema import PClientNote, PClientNoteCreate
from server.shared.databasemanager import DatabaseManager
from server.shared.pydantic import PList


def get_router(database: DatabaseManager, auth_verifier: AuthVerifier) -> APIRouter:
    router = APIRouter()

    @router.get("/client/{client_id}/note")
    async def list_notes_route(
        client_id: str,
        _: UserTokenInfo = auth_verifier.UserTokenInfo(),
    ) -> PList[PClientNote]:
        with database.create_session() as session:
            notes = list_client_notes(session, client_id)
            return PList(data=notes)

    @router.post("/client/{client_id}/note")
    async def create_note_route(
        client_id: str,
        data: PClientNoteCreate,
        user: UserTokenInfo = auth_verifier.UserTokenInfo(),
    ) -> PClientNote:
        with database.create_session() as session:
            return create_client_note(session, client_id, user.user_id, data)

    return router
