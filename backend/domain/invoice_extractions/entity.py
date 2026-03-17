from datetime import datetime, timezone
from typing import Optional, Dict, Any, TYPE_CHECKING

from sqlalchemy import JSON as SAJSON
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Column, Field, SQLModel, Relationship


if TYPE_CHECKING:
    from domain.invoices.entity import Invoice


class InvoiceExtractionBase(SQLModel):
    extracted_data: Dict[str, Any] = Field(
        default_factory=dict,
        sa_column=Column(JSONB().with_variant(SAJSON(), "sqlite"))
    )

    model: Optional[str] = None


class InvoiceExtraction(InvoiceExtractionBase, table=True):
    __tablename__ = "invoice_extractions"

    id: Optional[int] = Field(default=None, primary_key=True)

    invoice_id: int = Field(foreign_key="invoice.id", index=True)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    invoice: "Invoice" = Relationship(back_populates="extractions")