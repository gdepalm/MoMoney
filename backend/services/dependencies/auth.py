from fastapi import Depends, HTTPException, Request
from sqlmodel import Session

from domain.users.entity import User
from services.dependencies.database import get_session


def get_current_user(
    request: Request,
    session: Session = Depends(get_session)
) -> User:
    user_info = request.session.get("user")
    if not user_info or not user_info.get("id"):
        raise HTTPException(status_code=401, detail="Not authenticated")

    user = session.get(User, user_info["id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user
