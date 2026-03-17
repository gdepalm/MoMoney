import os
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, delete

from domain.groups.entity import Group
from domain.invoices.entity import Invoice
from domain.invoice_extractions.entity import InvoiceExtraction
from domain.invoice_extractions.schemas import (
    InvoiceExtractionRead
)
from domain.users.entity import User

from services.dependencies.auth import get_current_user
from services.dependencies.database import get_session
from services.gemini_services import extract_invoice_from_image


router = APIRouter()


@router.post("/invoices/{invoice_id}/extractions", response_model=InvoiceExtractionRead)
def create_invoice_extraction(
    invoice_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    group = session.get(Group, invoice.group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    model = os.getenv("LLM_MODEL")
    extracted = extract_invoice_from_image(invoice.image_url, model)

    session.exec(
        delete(InvoiceExtraction).where(
            InvoiceExtraction.invoice_id == invoice_id
        )
    )

    extraction = InvoiceExtraction(
        invoice_id=invoice_id,
        extracted_data=extracted,
        model=model,
    )

    session.add(extraction)
    session.commit()
    session.refresh(extraction)
    return extraction

@router.get("/invoices/{invoice_id}/extractions", response_model=list[InvoiceExtractionRead])
def read_invoice_extractions(
    invoice_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    group = session.get(Group, invoice.group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    statement = select(InvoiceExtraction).where(
        InvoiceExtraction.invoice_id == invoice_id
    )

    return session.exec(statement).all()