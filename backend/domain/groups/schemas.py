from sqlmodel import SQLModel
from typing import Optional


class GroupCreate(SQLModel):
    name: str
    columns: list[str] = []


class GroupRead(SQLModel):
    id: int
    name: str
    owner_id: int
    columns: list[str] = []


class GroupUpdate(SQLModel):
    name: Optional[str] = None
    columns: Optional[list[str]] = None
