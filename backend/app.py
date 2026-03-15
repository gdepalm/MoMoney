from fastapi import FastAPI
import os
from starlette.middleware.sessions import SessionMiddleware
from sqlmodel import SQLModel

from domain.users.routes import router as user_router
from database import engine


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


app = FastAPI()
app.add_middleware(SessionMiddleware,
                   secret_key=os.getenv("SESSION_SECRET_KEY", "a_secret_key"))


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/ping")
def ping():
    return {"message": "pong"}


app.include_router(user_router)
