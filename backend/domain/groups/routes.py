from fastapi import APIRouter, Request, Depends
from starlette.responses import RedirectResponse
from sqlmodel import Session, select

from services.oauth_services import oauth
from domain.users.entity import User
from domain.groups.entity import Group
from domain.groups.schemas import GroupCreate, GroupResponse
from database import get_session

router = APIRouter()


@router.post("/")
async def create_group(request: Request, session: Session = Depends(get_session)):
    user = request.session.get('user')
    if not user:
        return RedirectResponse(url='/users/login')

    # Here you would add logic to create a new group in the database
    # For example:
    new_group = Group(owner_id=user['id'], name="New Group", columns=[])
    session.add(new_group)
    session.commit()
    session.refresh(new_group)

    return {"message": "Group created successfully"}


@router.delete("/{group_id}")
async def delete_group(group_id: int, request: Request, session: Session = Depends(get_session)):
    user = request.session.get('user')
    if not user:
        return RedirectResponse(url='/users/login')

    # Here you would add logic to delete the group from the database
    # For example:
    statement = select(Group).where(
        Group.id == group_id, Group.owner_id == user['id'])
    group = session.exec(statement).first()
    if group:
        session.delete(group)
        session.commit()
        return {"message": "Group deleted successfully"}
    else:
        return {"message": "Group not found or you do not have permission to delete it"}


@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(group_id: int, request: Request, session: Session = Depends(get_session)):
    user = request.session.get('user')
    if not user:
        return RedirectResponse(url='/users/login')

    # Here you would add logic to retrieve the group from the database
    # For example:
    statement = select(Group).where(
        Group.id == group_id, Group.owner_id == user['id'])
    group = session.exec(statement).first()
    if group:
        return GroupResponse(id=group.id, name=group.name, columns=group.columns)
    else:
        return {"message": "Group not found or you do not have permission to view it"}


@router.get("/", response_model=list[GroupResponse])
async def list_groups(request: Request, session: Session = Depends(get_session)):
    user = request.session.get('user')
    if not user:
        return RedirectResponse(url='/users/login')

    # Here you would add logic to retrieve all groups for the user from the database
    # For example:
    statement = select(Group).where(Group.owner_id == user['id'])
    groups = session.exec(statement).all()
    return [GroupResponse(id=group.id, name=group.name, columns=group.columns) for group in groups]


@router.put("/{group_id}")
async def update_group(group_id: int, group_data: GroupCreate, request: Request, session: Session = Depends(get_session)):
    user = request.session.get('user')
    if not user:
        return RedirectResponse(url='/users/login')

    # Here you would add logic to update the group in the database
    # For example:
    statement = select(Group).where(
        Group.id == group_id, Group.owner_id == user['id'])
    group = session.exec(statement).first()
    if group:
        group.name = group_data.name
        group.columns = group_data.columns
        session.add(group)
        session.commit()
        session.refresh(group)
        return {"message": "Group updated successfully"}
    else:
        return {"message": "Group not found or you do not have permission to update it"}
