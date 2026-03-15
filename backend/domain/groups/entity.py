from typing import Optional
from sqlmodel import Field, SQLModel


class Group(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(index=True)
    name: str
    columns: list[str] = Field(default_factory=list)
