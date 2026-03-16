from sqlmodel import Field, SQLModel
from typing import Optional

from domain.invoices.schemas import InvoiceRead


class GroupCreate(SQLModel):
    name: str
    columns: list[str] = Field(default_factory=list)


class GroupRead(SQLModel):
    id: int
    name: str
    owner_id: int
    columns: list[str] = Field(default_factory=list)


class GroupReadWithInvoices(GroupRead):
    invoices: list[InvoiceRead] = Field(default_factory=list)


class GroupUpdate(SQLModel):
    name: Optional[str] = None
    columns: Optional[list[str]] = None
