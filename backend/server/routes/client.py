from fastapi import APIRouter, HTTPException, status

from sqlalchemy.exc import IntegrityError

from server.business.auth.auth_verifier import AuthVerifier
from server.business.auth.schema import UserTokenInfo
from server.business.client.create import create_client
from server.business.client.get import get_client
from server.business.client.list import list_clients
from server.business.client.schema import PClient, PClientCreate
from server.shared.databasemanager import DatabaseManager
from server.shared.pydantic import PList


def get_router(database: DatabaseManager, auth_verifier: AuthVerifier) -> APIRouter:
    router = APIRouter()

    @router.get("/client")
    async def list_clients_route(
        _: UserTokenInfo = auth_verifier.UserTokenInfo(),
    ) -> PList[PClient]:
        with database.create_session() as session:
            clients = list_clients(session)
            return PList(data=clients)

    @router.get("/client/{client_id}")
    async def get_client_route(
        client_id: str,
        _: UserTokenInfo = auth_verifier.UserTokenInfo(),
    ) -> PClient:
        with database.create_session() as session:
            client = get_client(session, client_id)
            if client is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Client not found",
                )
            return client

    @router.post("/client")
    async def create_client_route(
        data: PClientCreate,
        _: UserTokenInfo = auth_verifier.UserTokenInfo(),
    ) -> PClient:
        try:
            with database.create_session() as session:
                return create_client(session, data)
        except IntegrityError:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A client with this email already exists",
            )

    return router
