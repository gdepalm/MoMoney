from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlmodel import Session, select, delete
from typing import List, Any
from pydantic import BaseModel

from domain.groups.entity import Group
from domain.invoices.entity import Invoice
from domain.invoices.schemas import InvoiceCreate, InvoiceRead, InvoiceUpdate
from domain.invoice_extractions.entity import InvoiceExtraction
from domain.users.entity import User
from services.dependencies.auth import get_current_user
from services.dependencies.database import get_session
from services.gemini_services import extract_invoice_from_bytes
import os


class InsertToSheetRequest(BaseModel):
    items: List[dict[str, Any]]


router = APIRouter()


@router.post("/{invoice_id}/upload-receipt")
async def upload_receipt(
    invoice_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Upload a receipt image and extract data using AI"""
    try:
        invoice = session.get(Invoice, invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        group = session.get(Group, invoice.group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        if group.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        
        # Read the uploaded file
        contents = await file.read()
        
        # Extract data using Gemini AI
        model = os.getenv("LLM_MODEL", "gemini-2.5-flash")
        extracted_data = extract_invoice_from_bytes(contents, model)
        
        # Create preview data in the format expected by frontend
        preview = {
            "items": [extracted_data] if isinstance(extracted_data, dict) else extracted_data,
            "confidence": 0.95,
            "rawText": None
        }
        
        return {
            "jobId": str(invoice_id),
            "preview": preview
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{invoice_id}/insert-to-sheet")
async def insert_to_sheet(
    invoice_id: int,
    payload: InsertToSheetRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Save extracted invoice data to the database"""
    try:
        invoice = session.get(Invoice, invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        group = session.get(Group, invoice.group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        if group.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        
        model = os.getenv("LLM_MODEL", "gemini-2.5-flash")
        
        # Delete existing extractions for this invoice
        session.exec(
            delete(InvoiceExtraction).where(
                InvoiceExtraction.invoice_id == invoice_id
            )
        )
        
        # Create new extraction record(s)
        inserted_rows = 0
        for item in payload.items:
            extraction = InvoiceExtraction(
                invoice_id=invoice_id,
                extracted_data=item,
                model=model,
            )
            session.add(extraction)
            inserted_rows += 1
        
        session.commit()
        
        return {
            "success": True,
            "insertedRows": inserted_rows
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[InvoiceRead])
def list_invoices(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List all invoices from groups owned by the current user"""
    statement = select(Invoice).join(Group).where(Group.owner_id == current_user.id)
    invoices = session.exec(statement).all()
    return invoices


@router.get("/{invoice_id}", response_model=InvoiceRead)
def get_invoice(
    invoice_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a single invoice by ID"""
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    group = session.get(Group, invoice.group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return invoice


@router.post("/groups/{group_id}/invoices", response_model=InvoiceRead)
def create_invoice(
    group_id: int,
    payload: InvoiceCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    invoice = Invoice(
        group_id=group_id,
        data=payload.data,
        image_url=payload.image_url,
    )
    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    return invoice


@router.patch("/invoices/{invoice_id}", response_model=InvoiceRead)
def update_invoice(
    invoice_id: int,
    payload: InvoiceUpdate,
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

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(invoice, key, value)

    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    return invoice


@router.delete("/invoices/{invoice_id}")
def delete_invoice(
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

    session.delete(invoice)
    session.commit()
    return {"ok": True}
