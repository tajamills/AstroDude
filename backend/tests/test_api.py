import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


def test_health_check():
    """Backend health endpoint works"""
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200
    data = r.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


def test_api_root():
    """Root API endpoint returns version info"""
    r = requests.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    data = r.json()
    assert "AstroLaunch" in data.get("message", "")


class TestRegistration:
    def test_register_new_user(self, api_client):
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "name": f"TEST_User_{unique_id}",
            "email": f"test_{unique_id}@testastro.com",
            "password": "testpass123"
        }
        r = api_client.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == payload["email"]
        assert data["user"]["name"] == payload["name"]
        assert data["user"]["onboarding_complete"] == False
        assert "id" in data["user"]

    def test_register_duplicate_email(self, api_client):
        """Duplicate email registration should fail with 400"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "name": f"TEST_User_{unique_id}",
            "email": f"test_{unique_id}@testastro.com",
            "password": "testpass123"
        }
        # Register first time
        r1 = api_client.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert r1.status_code == 200
        # Register second time
        r2 = api_client.post(f"{BASE_URL}/api/auth/register", json=payload)
        assert r2.status_code == 400
        assert "already registered" in r2.json().get("detail", "").lower()

    def test_register_missing_fields(self, api_client):
        """Registration without required fields should fail"""
        r = api_client.post(f"{BASE_URL}/api/auth/register", json={"email": "test@x.com"})
        assert r.status_code == 422  # Unprocessable Entity


class TestLogin:
    def test_login_valid_credentials(self, api_client, registered_user):
        r = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": registered_user["email"],
            "password": registered_user["password"]
        })
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["user"]["email"] == registered_user["email"]

    def test_login_invalid_password(self, api_client, registered_user):
        r = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": registered_user["email"],
            "password": "wrongpassword"
        })
        assert r.status_code == 401

    def test_login_nonexistent_user(self, api_client):
        r = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@testastro.com",
            "password": "somepassword"
        })
        assert r.status_code == 401

    def test_get_me_with_valid_token(self, authenticated_client, registered_user):
        r = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == registered_user["email"]
        assert data["name"] == registered_user["name"]

    def test_get_me_without_token(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code in [401, 403]

    def test_get_me_with_invalid_token(self, api_client):
        api_client.headers.update({"Authorization": "Bearer invalid.token.here"})
        r = api_client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401


class TestOnboarding:
    def test_update_onboarding(self, authenticated_client, registered_user):
        payload = {
            "onboarding": {
                "goals": ["career", "business"],
                "birth_date": "1990-05-15",
                "birth_time": "14:30",
                "birth_location": "New York, USA",
                "career_interests": ["entrepreneur", "tech"],
                "life_focus": ["career_path", "wealth"],
                "has_partner": False,
                "partner_birth_date": None
            }
        }
        r = authenticated_client.put(f"{BASE_URL}/api/users/onboarding", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data.get("success") == True

    def test_onboarding_persists_to_profile(self, authenticated_client, registered_user):
        """After onboarding, profile should show complete status"""
        payload = {
            "onboarding": {
                "goals": ["timing"],
                "birth_date": "1985-08-20",
                "birth_time": None,
                "birth_location": "London, UK",
                "career_interests": ["finance"],
                "life_focus": ["lucky_numbers"],
                "has_partner": True,
                "partner_birth_date": "1988-03-10"
            }
        }
        authenticated_client.put(f"{BASE_URL}/api/users/onboarding", json=payload)
        
        # Verify via /auth/me
        r = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        assert r.json()["onboarding_complete"] == True

    def test_onboarding_requires_auth(self, api_client):
        payload = {"onboarding": {"birth_date": "1990-01-01", "birth_location": "NYC"}}
        r = api_client.put(f"{BASE_URL}/api/users/onboarding", json=payload)
        assert r.status_code in [401, 403]


class TestLuckScore:
    def test_get_today_luck_requires_onboarding(self, authenticated_client):
        """User without onboarding should get 400"""
        r = authenticated_client.get(f"{BASE_URL}/api/luck/today")
        assert r.status_code == 400
        assert "onboarding" in r.json()["detail"].lower()

    def test_get_today_luck_after_onboarding(self, onboarded_client):
        r = onboarded_client.get(f"{BASE_URL}/api/luck/today")
        assert r.status_code == 200
        data = r.json()
        # Validate all required fields
        assert "total_score" in data
        assert 0 <= data["total_score"] <= 100
        assert "western_score" in data
        assert "chinese_score" in data
        assert "numerology_score" in data
        assert "element_score" in data
        assert "lucky_color" in data
        assert "lucky_number" in data
        assert "recommended_activities" in data
        assert isinstance(data["recommended_activities"], list)
        assert "avoid_activities" in data
        assert "zodiac_sign" in data
        assert "chinese_zodiac" in data
        assert "life_path_number" in data
        assert "dominant_element" in data

    def test_luck_score_components_sum(self, onboarded_client):
        """Component scores should sum to total_score"""
        r = onboarded_client.get(f"{BASE_URL}/api/luck/today")
        assert r.status_code == 200
        data = r.json()
        component_sum = (
            data["western_score"] + data["chinese_score"] +
            data["numerology_score"] + data["element_score"]
        )
        assert data["total_score"] == component_sum

    def test_get_luck_for_specific_date(self, onboarded_client):
        r = onboarded_client.get(f"{BASE_URL}/api/luck/date/2025-01-01")
        assert r.status_code == 200
        data = r.json()
        assert data["date"] == "2025-01-01"
        assert 0 <= data["total_score"] <= 100

    def test_get_luck_invalid_date(self, onboarded_client):
        r = onboarded_client.get(f"{BASE_URL}/api/luck/date/invalid-date")
        assert r.status_code == 400

    def test_get_week_forecast(self, onboarded_client):
        r = onboarded_client.get(f"{BASE_URL}/api/luck/week")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 7
        for day in data:
            assert "date" in day
            assert "day_name" in day
            assert "score" in day
            assert 0 <= day["score"] <= 100
            assert "lucky_color" in day
            assert "lucky_number" in day

    def test_get_luck_history(self, onboarded_client):
        # First trigger today's score creation
        onboarded_client.get(f"{BASE_URL}/api/luck/today")
        
        r = onboarded_client.get(f"{BASE_URL}/api/luck/history")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        # Should have at least the today score
        assert len(data) >= 1

    def test_today_luck_score_cached(self, onboarded_client):
        """Calling today's luck twice should return same score"""
        r1 = onboarded_client.get(f"{BASE_URL}/api/luck/today")
        r2 = onboarded_client.get(f"{BASE_URL}/api/luck/today")
        assert r1.status_code == 200
        assert r2.status_code == 200
        assert r1.json()["total_score"] == r2.json()["total_score"]
        assert r1.json()["id"] == r2.json()["id"]  # Same cached document

    def test_luck_requires_auth(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/luck/today")
        assert r.status_code in [401, 403]


class TestUserProfile:
    def test_get_profile_authenticated(self, onboarded_client):
        r = onboarded_client.get(f"{BASE_URL}/api/users/profile")
        assert r.status_code == 200
        data = r.json()
        assert "id" in data
        assert "email" in data
        assert "name" in data
        assert "password_hash" not in data  # Should not expose password

    def test_get_profile_requires_auth(self, api_client):
        r = api_client.get(f"{BASE_URL}/api/users/profile")
        assert r.status_code in [401, 403]
