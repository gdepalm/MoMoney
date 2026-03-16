from typing import Optional, List, TYPE_CHECKING
from sqlmodel import Field, SQLModel, JSON, Column, Relationship
from domain.users.entity import User

if TYPE_CHECKING:
    from domain.invoices.entity import Invoice


class Group(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    owner_id: int = Field(foreign_key="user.id")
    columns: List[str] = Field(default_factory=list, sa_column=Column(JSON))
    owner: "User" = Relationship(back_populates="owned_groups")
    invoices: List["Invoice"] = Relationship(
        back_populates="group",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
