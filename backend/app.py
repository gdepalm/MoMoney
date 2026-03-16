from contextlib import asynccontextmanager
from fastapi import FastAPI
import os
from starlette.middleware.sessions import SessionMiddleware
from sqlmodel import SQLModel

from domain.users.routes import router as user_router
from domain.groups.routes import router as group_router
from domain.invoices.routes import router as invoice_router
from services.dependencies.database import engine


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # on startup
    create_db_and_tables()
    yield
    # on shutdown


app = FastAPI(lifespan=lifespan)
app.add_middleware(SessionMiddleware,
                   secret_key=os.getenv("SESSION_SECRET_KEY", "a_secret_key"))


@app.get("/")
def greet():
    return {"message": "Welcome to the MoMoney API!"}


@app.get("/ping")
def ping():
    return {"message": "pong"}


app.include_router(user_router, tags=["users"])
app.include_router(group_router, prefix="/groups", tags=["groups"])
app.include_router(invoice_router, tags=["invoices"])
