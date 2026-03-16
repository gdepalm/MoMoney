from datetime import datetime
from typing import Optional, Dict, Any

from sqlmodel import Field, SQLModel


class InvoiceCreate(SQLModel):
    data: Dict[str, Any] = Field(default_factory=dict)
    image_url: Optional[str] = None


class InvoiceUpdate(SQLModel):
    data: Optional[Dict[str, Any]] = None
    image_url: Optional[str] = None


class InvoiceRead(SQLModel):
    id: int
    group_id: int
    data: Dict[str, Any]
    image_url: Optional[str] = None
    created_at: datetime
