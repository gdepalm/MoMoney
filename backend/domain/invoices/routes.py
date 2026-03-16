from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from domain.groups.entity import Group
from domain.invoices.entity import Invoice
from domain.invoices.schemas import InvoiceCreate, InvoiceRead, InvoiceUpdate
from domain.users.entity import User
from services.dependencies.auth import get_current_user
from services.dependencies.database import get_session

router = APIRouter()


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
