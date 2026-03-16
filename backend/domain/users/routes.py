from fastapi import APIRouter, Request, Depends
from starlette.responses import RedirectResponse
from sqlmodel import Session, select
from services.oauth_services import oauth
from services.dependencies.database import get_session
from domain.users.entity import User

router = APIRouter()


@router.post("/test-login")
async def test_login(request: Request, session: Session = Depends(get_session)):
    """Test endpoint - logs in as a test user without Google OAuth"""
    test_user = {
        "id": "test-user-123",
        "email": "test@example.com",
        "name": "Test User",
        "google_id": "test-google-id"
    }
    db_user = User(
        google_id=test_user['google_id'],
        name=test_user['name'],
        email=test_user['email']
    )
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    request.session["user"] = db_user.dict()
    return {"message": "Test login successful", "user": db_user.dict()}


@router.get("/login")
async def login(request: Request):
    # This generates the URL to Google's login page
    redirect_uri = request.url_for('auth_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/auth/callback", name='auth_callback')
async def auth_callback(request: Request, session: Session = Depends(get_session)):
    # Google sends the user back here with a code
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get('userinfo')
    if not user_info:
        return RedirectResponse(url='/users/login-error')

    google_id = user_info['sub']

    # Check if user already exists
    statement = select(User).where(User.google_id == google_id)
    db_user = session.exec(statement).first()

    if db_user:
        # User exists, update their info if necessary
        db_user.name = user_info['name']
        db_user.email = user_info['email']
    else:
        # User does not exist, create a new one
        db_user = User(
            google_id=google_id,
            name=user_info['name'],
            email=user_info['email']
        )

    session.add(db_user)
    session.commit()
    session.refresh(db_user)

    request.session['user'] = db_user.dict()
    return RedirectResponse(url='/users/')


@router.get("/users/")
async def homepage(request: Request):
    user = request.session.get('user')
    if user:
        print(f"User info: {user}")
        return {"message": f"Hello, {user['name']}", "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email']
        }}
    return {"message": "Not logged in. Go to /login"}
