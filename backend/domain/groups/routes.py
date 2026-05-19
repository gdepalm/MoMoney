import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from domain.groups.entity import Group
from domain.groups.schemas import GroupCreate, GroupRead, GroupReadWithInvoices, GroupUpdate
from domain.invoices.entity import Invoice
from domain.invoices.schemas import InvoiceCreate, InvoiceRead
from domain.users.entity import User
from services.dependencies.auth import get_current_user
from services.dependencies.database import get_session
from services.extraction_services import extract_invoice_from_bytes
from services.llm_config import get_llm_model

router = APIRouter()


@router.post("/", response_model=GroupRead)
def create_group(
    *,
    session: Session = Depends(get_session),
    group: GroupCreate,
    current_user: User = Depends(get_current_user)
):
    db_group = Group(name=group.name, owner_id=current_user.id,
                     columns=group.columns if hasattr(group, 'columns') else [])
    session.add(db_group)
    session.commit()
    session.refresh(db_group)
    return db_group


@router.get("/", response_model=list[GroupRead])
def read_groups(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = select(Group).where(Group.owner_id == current_user.id)
    return session.exec(statement).all()


@router.get("/{group_id}", response_model=GroupReadWithInvoices)
def read_group(
    group_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    statement = (
        select(Group)
        .where(Group.id == group_id)
        .options(selectinload(Group.invoices))
    )
    group = session.exec(statement).first()
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return group


@router.patch("/{group_id}", response_model=GroupRead)
def update_group(
    group_id: int,
    group: GroupUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    db_group = session.get(Group, group_id)
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    if db_group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    group_data = group.model_dump(exclude_unset=True)
    for key, value in group_data.items():
        setattr(db_group, key, value)

    session.add(db_group)
    session.commit()
    session.refresh(db_group)
    return db_group


@router.delete("/{group_id}")
def delete_group(
    group_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    group = session.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    if group.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    session.delete(group)
    session.commit()
    return {"ok": True}


@router.post("/{group_id}/upload-receipt")
async def upload_receipt_for_group(
    group_id: int,
    file: UploadFile = File(...),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Extract invoice data from a receipt image without creating any DB records."""
    try:
        group = session.get(Group, group_id)
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")
        if group.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not enough permissions")

        contents = await file.read()

        raw_llm_model = os.getenv("LLM_MODEL")
        model = get_llm_model()
        print(
            "LLM_MODEL resolved for group upload-receipt:",
            {"env": raw_llm_model, "used": model},
        )

        extracted_data = extract_invoice_from_bytes(contents, group.columns, model)

        preview = {
            "items": [extracted_data] if isinstance(extracted_data, dict) else extracted_data,
            "confidence": 0.95,
            "rawText": None,
        }

        return {"preview": preview}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{group_id}/invoices", response_model=InvoiceRead)
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
