import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select, delete
from typing import Optional

from domain.groups.entity import Group
from domain.invoices.entity import Invoice
from domain.invoice_extractions.entity import InvoiceExtraction
from domain.invoice_extractions.schemas import (
    InvoiceExtractionRead
)
from domain.users.entity import User

from services.dependencies.auth import get_current_user
from services.dependencies.database import get_session
from services.gemini_services import extract_invoice_from_image, extract_invoice_from_bytes


router = APIRouter()


@router.post("/invoices/{invoice_id}/extractions", response_model=InvoiceExtractionRead)
async def create_invoice_extraction(
    invoice_id: int,
    file: Optional[UploadFile] = File(None),
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
    
    model = os.getenv("LLM_MODEL", "gemini-2.5-flash")
    
    # Extract from uploaded file or invoice's image URL
    try:
        if file:
            contents = await file.read()
            extracted = extract_invoice_from_bytes(contents, model)
        else:
            if not invoice.image_url:
                raise HTTPException(status_code=400, detail="No image provided or found in invoice")
            extracted = extract_invoice_from_image(invoice.image_url, model)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

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