import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture
def api_client():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def test_user_credentials():
    """Returns unique user credentials for isolated tests"""
    unique_id = uuid.uuid4().hex[:8]
    return {
        "name": f"TEST_User_{unique_id}",
        "email": f"test_{unique_id}@testastro.com",
        "password": "testpass123"
    }

@pytest.fixture
def registered_user(api_client, test_user_credentials):
    """Register a new test user and return token + user info"""
    creds = test_user_credentials
    response = api_client.post(f"{BASE_URL}/api/auth/register", json=creds)
    assert response.status_code == 200, f"Registration failed: {response.text}"
    data = response.json()
    token = data["access_token"]
    user_id = data["user"]["id"]
    yield {
        "token": token,
        "user_id": user_id,
        "email": creds["email"],
        "name": creds["name"],
        "password": creds["password"]
    }
    # Cleanup: no delete endpoint, but test data is isolated

@pytest.fixture
def authenticated_client(api_client, registered_user):
    """Session with auth header for a newly registered user"""
    api_client.headers.update({"Authorization": f"Bearer {registered_user['token']}"})
    return api_client

@pytest.fixture
def onboarded_client(api_client, registered_user):
    """Session for a user with completed onboarding"""
    api_client.headers.update({"Authorization": f"Bearer {registered_user['token']}"})
    # Complete onboarding
    api_client.put(f"{BASE_URL}/api/users/onboarding", json={
        "onboarding": {
            "goals": ["career"],
            "birth_date": "1990-05-15",
            "birth_time": "14:30",
            "birth_location": "New York, USA",
            "career_interests": ["entrepreneur"],
            "life_focus": ["career_path"],
            "has_partner": False,
            "partner_birth_date": None
        }
    })
    return api_client

@pytest.fixture
def existing_test_user(api_client):
    """Pre-existing test user credentials"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test@astro.com",
        "password": "test123"
    })
    if response.status_code == 200:
        data = response.json()
        api_client.headers.update({"Authorization": f"Bearer {data['access_token']}"})
        return api_client
    pytest.skip("Pre-existing test user not available")
