from fastapi import Depends, HTTPException, Request
from sqlmodel import Session

from domain.users.entity import User
from services.dependencies.database import get_session


def get_current_user(
    request: Request,
    session: Session = Depends(get_session)
) -> User:
    """
    Get the current authenticated user from the session.
    If the user exists in the session, return it as a User object.
    """
    user_info = request.session.get("user")
    if not user_info:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Validate required fields
    if not user_info.get("id") or not user_info.get("google_id"):
        raise HTTPException(status_code=401, detail="Invalid session data")
    
    # Try to fetch from database, but don't fail if not found
    # (in case database was reset but session is still valid)
    try:
        user = session.get(User, user_info["id"])
        if user:
            return user
    except Exception as e:
        print(f"Error fetching user from database: {e}")
    
    # If not in database, create a temporary User object from session data
    # This allows the app to work even if database is reset
    temp_user = User(
        id=user_info.get("id"),
        google_id=user_info.get("google_id"),
        name=user_info.get("name", "Unknown"),
        email=user_info.get("email", "unknown@example.com")
    )
    return temp_user
