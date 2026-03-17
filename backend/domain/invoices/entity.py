from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, TYPE_CHECKING

from sqlalchemy import JSON as SAJSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, SQLModel, Relationship


if TYPE_CHECKING:
    from domain.groups.entity import Group

if TYPE_CHECKING:
    from domain.invoice_extractions.entity import InvoiceExtraction


class InvoiceBase(SQLModel):
    data: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB().with_variant(SAJSON(), "sqlite"))
    )
    image_url: Optional[str] = None


class Invoice(InvoiceBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    group_id: int = Field(foreign_key="group.id", index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc))

    group: "Group" = Relationship(back_populates="invoices")
    extractions: List["InvoiceExtraction"] = Relationship(back_populates="invoice")
