from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session, select

from domain.groups.entity import Group
from domain.groups.schemas import GroupCreate, GroupRead, GroupUpdate
from domain.users.entity import User
from database import get_session

router = APIRouter()


def get_current_user(request: Request, session: Session = Depends(get_session)) -> User:
    user_info = request.session.get("user")
    if not user_info or not user_info.get("id"):
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = session.get(User, user_info["id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


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


@router.get("/{group_id}", response_model=GroupRead)
def read_group(
    group_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    group = session.get(Group, group_id)
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
