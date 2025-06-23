import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os
import sys

# Add the parent directory to the path to allow imports from `app`
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app
from app.database import Base, get_db
from app.models import * # Import all models to ensure they are registered with Base

# --- Test Database Setup ---
# Use an in-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool, # Use a static pool for in-memory DB
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Pytest Fixtures ---

@pytest.fixture(scope="function")
def db_session():
    """
    Creates a new database session for a test, and cleans up afterwards.
    """
    Base.metadata.create_all(bind=engine) # Create tables
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine) # Drop tables after test

@pytest.fixture(scope="function")
def test_client(db_session):
    """
    Creates a FastAPI TestClient that uses the test database.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            db_session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    # Clean up dependency override
    app.dependency_overrides.clear() 

    #[+] Running 4/4
 #✔ backend                                   Built                                                     0.0s 
 #✔ frontend                                  Built                                                     0.0s 
 #✔ Container feedbacksystemcopy4-frontend-1  Running                                                   0.0s 
 #✔ Container feedbacksystemcopy4-backend-1   Started              