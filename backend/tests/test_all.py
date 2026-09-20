import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.core.database import Base, get_db
from backend.app.main import app

TEST_DB_URL = "sqlite:///./test_traffic.db"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test_traffic.db"):
        try:
            os.remove("test_traffic.db")
        except Exception:
            pass

def test_user_registration_and_login():
    # Register user
    reg_resp = client.post("/api/auth/register", json={
        "email": "officer1@control.gov",
        "username": "officer1",
        "password": "password123",
        "full_name": "Officer One"
    })
    assert reg_resp.status_code == 201
    data = reg_resp.json()
    assert data["email"] == "officer1@control.gov"

    # Login user
    login_resp = client.post("/api/auth/login", json={
        "username_or_email": "officer1",
        "password": "password123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    assert token is not None

    # Test /me endpoint
    me_resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "officer1"

def test_per_user_data_isolation():
    # User 1
    u1_reg = client.post("/api/auth/register", json={"email": "u1@test.com", "username": "user1", "password": "password123"})
    u1_token = client.post("/api/auth/login", json={"username_or_email": "user1", "password": "password123"}).json()["access_token"]

    # User 2
    u2_reg = client.post("/api/auth/register", json={"email": "u2@test.com", "username": "user2", "password": "password123"})
    u2_token = client.post("/api/auth/login", json={"username_or_email": "user2", "password": "password123"}).json()["access_token"]

    # User 1 uploads dummy file
    dummy_video_content = b"fake video content mp4"
    files = {"file": ("traffic_u1.mp4", dummy_video_content, "video/mp4")}
    u1_up = client.post("/api/videos/upload", files=files, headers={"Authorization": f"Bearer {u1_token}"})
    assert u1_up.status_code == 201
    v1_id = u1_up.json()["id"]

    # User 1 can access video
    u1_get = client.get(f"/api/videos/{v1_id}", headers={"Authorization": f"Bearer {u1_token}"})
    assert u1_get.status_code == 200

    # User 2 CANNOT access User 1's video (404 / Access Denied isolation test)
    u2_get = client.get(f"/api/videos/{v1_id}", headers={"Authorization": f"Bearer {u2_token}"})
    assert u2_get.status_code == 404
    assert u2_get.json()["detail"] == "Video record not found or access denied"

def test_upload_validation():
    u_token = client.post("/api/auth/register", json={"email": "v@test.com", "username": "validator", "password": "password123"}).json()
    token = client.post("/api/auth/login", json={"username_or_email": "validator", "password": "password123"}).json()["access_token"]

    # Reject unsupported file format (.txt)
    txt_file = {"file": ("malicious.txt", b"some text", "text/plain")}
    resp_txt = client.post("/api/videos/upload", files=txt_file, headers={"Authorization": f"Bearer {token}"})
    assert resp_txt.status_code == 400
    assert "Unsupported file format" in resp_txt.json()["detail"]
