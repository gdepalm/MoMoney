import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
import tempfile
import os

from app import app
from services.dependencies.auth import get_current_user
from services.dependencies.database import get_session
from domain.users.entity import User
# Import to register Group model with SQLModel metadata
from domain.groups.entity import Group

# Use a temporary file-based SQLite database for testing
# This is more reliable than in-memory for multi-connection scenarios
test_db_dir = tempfile.mkdtemp()
test_db_file = os.path.join(test_db_dir, "test.db")
DATABASE_URL = f"sqlite:///{test_db_file}"
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=True
)


def override_get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


# Override the get_session dependency for the app
app.dependency_overrides[get_session] = override_get_session


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables at the start of the test session"""
    SQLModel.metadata.create_all(engine)
    yield
    # Optionally drop all tables after the session ends
    # SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="session")
def session_fixture() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    with TestClient(app) as client:
        yield client


@pytest.fixture(name="test_user", scope="session")
def test_user_fixture() -> User:
    # Create a session for the test user
    with Session(engine) as session:
        user = User(
            google_id="test_google_id_123",
            name="Test User",
            email="test@example.com"
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        return user


@pytest.fixture(name="authenticated_client")
def authenticated_client_fixture(client: TestClient, test_user: User) -> Generator[TestClient, None, None]:
    # Override get_current_user to return the test user

    def override_get_current_user():
        return test_user

    app.dependency_overrides[get_current_user] = override_get_current_user
    yield client
    # Clean up after the test
    app.dependency_overrides.pop(get_current_user, None)
