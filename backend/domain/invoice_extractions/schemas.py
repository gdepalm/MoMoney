from datetime import datetime
from typing import Optional, Dict, Any

from sqlmodel import Field, SQLModel


class InvoiceExtractionRead(SQLModel):
    id: int
    invoice_id: int
    extracted_data: Dict[str, Any]
    model: Optional[str] = None
    created_at: datetime