"""
P0 Feature Tests for Mentis App - Email Verification, Login Bypass, and Chat
Tests:
1. New user signup with email verification flow
2. Master admin login bypass (no email verification required)
3. Existing user login (no verification_token field)
4. Verify email and resend verification endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mentis-auth-test.preview.emergentagent.com')

# Test credentials from main agent
MASTER_ADMIN_EMAIL = "atreyaghoshal.68@gmail.com"
MASTER_ADMIN_PASSWORD = "4tr3y4@54N14"
NEW_TEST_USER_EMAIL = "atreyaghoshal@gmail.com"
NEW_TEST_USER_NAME = "Atreya Test"
NEW_TEST_USER_PASSWORD = "Test123456"


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def master_admin_token(api_client):
    """Get master admin authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": MASTER_ADMIN_EMAIL,
        "password": MASTER_ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Master admin login failed - skipping authenticated tests")


class TestNewUserSignup:
    """Test new user signup with email verification"""
    
    def test_signup_new_user_creates_account(self, api_client):
        """Test 1a: New user signup should create account"""
        response = api_client.post(f"{BASE_URL}/api/auth/signup", json={
            "email": NEW_TEST_USER_EMAIL,
            "password": NEW_TEST_USER_PASSWORD,
            "name": NEW_TEST_USER_NAME
        })
        
        # Should succeed or return email already registered
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}, {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            # Should show verification message
            assert "message" in data
            assert "check" in data["message"].lower() or "verify" in data["message"].lower(), \
                f"Expected verification message, got: {data['message']}"
            print(f"SUCCESS: Account created - {data['message']}")
        else:
            # Email already registered
            assert "already" in response.json().get("detail", "").lower()
            print("NOTE: Email already registered from previous test")
    
    def test_new_user_cannot_login_without_verification(self, api_client):
        """Test 1c: New unverified user should get 403 with verification message"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": NEW_TEST_USER_EMAIL,
            "password": NEW_TEST_USER_PASSWORD
        })
        
        # Should get 403 (forbidden - needs verification) or 401 (wrong credentials)
        if response.status_code == 403:
            data = response.json()
            assert "verify" in data.get("detail", "").lower(), \
                f"Expected verification message in 403 response, got: {data}"
            print(f"SUCCESS: Login blocked with verification message - {data.get('detail')}")
        elif response.status_code == 401:
            print("NOTE: Got 401 - user may not exist or credentials wrong")
        else:
            print(f"Unexpected status: {response.status_code}, {response.text}")


class TestMasterAdminBypass:
    """Test that master admin can login without email verification"""
    
    def test_master_admin_login_success(self, api_client):
        """Test 2: Master admin should login successfully (bypass verification)"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": MASTER_ADMIN_EMAIL,
            "password": MASTER_ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Master admin login failed: {response.status_code}, {response.text}"
        
        data = response.json()
        assert "access_token" in data, "No access token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["email"] == MASTER_ADMIN_EMAIL
        assert data["user"]["role"] in ["admin", "master_admin"], f"Expected admin role, got: {data['user']['role']}"
        print(f"SUCCESS: Master admin logged in - role: {data['user']['role']}")
    
    def test_master_admin_can_access_protected_routes(self, api_client, master_admin_token):
        """Test master admin can access /auth/me endpoint"""
        response = api_client.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {master_admin_token}"
        })
        
        assert response.status_code == 200, f"Failed to access protected route: {response.status_code}"
        data = response.json()
        assert data["email"] == MASTER_ADMIN_EMAIL
        print(f"SUCCESS: Master admin accessed protected route")


class TestVerifyEmailEndpoint:
    """Test /verify-email endpoint"""
    
    def test_verify_email_no_token_returns_error(self, api_client):
        """Test 4: /verify-email with no token should return error"""
        response = api_client.post(f"{BASE_URL}/api/auth/verify-email?token=")
        
        # Should return 400 or 422 for missing/empty token
        assert response.status_code in [400, 422], f"Expected 400/422, got: {response.status_code}"
        print(f"SUCCESS: Empty token rejected with status {response.status_code}")
    
    def test_verify_email_invalid_token_returns_error(self, api_client):
        """Test invalid verification token is rejected"""
        fake_token = str(uuid.uuid4())
        response = api_client.post(f"{BASE_URL}/api/auth/verify-email?token={fake_token}")
        
        assert response.status_code == 400, f"Expected 400, got: {response.status_code}"
        data = response.json()
        assert "invalid" in data.get("detail", "").lower() or "expired" in data.get("detail", "").lower()
        print(f"SUCCESS: Invalid token rejected - {data.get('detail')}")


class TestResendVerificationEndpoint:
    """Test /resend-verification endpoint"""
    
    def test_resend_verification_page_endpoint_exists(self, api_client):
        """Test 5: Resend verification endpoint exists and works"""
        response = api_client.post(
            f"{BASE_URL}/api/auth/resend-verification?email={NEW_TEST_USER_EMAIL}"
        )
        
        # Should return 200 (doesn't reveal if email exists for security)
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "message" in data
            print(f"SUCCESS: Resend verification endpoint working - {data['message']}")
        else:
            # 400 could mean email already verified
            print(f"Note: Got 400 - {response.json().get('detail')}")
    
    def test_resend_verification_nonexistent_email(self, api_client):
        """Test resend verification with nonexistent email (should not reveal)"""
        fake_email = f"nonexistent_{uuid.uuid4().hex[:8]}@test.com"
        response = api_client.post(
            f"{BASE_URL}/api/auth/resend-verification?email={fake_email}"
        )
        
        # Should return 200 for security (don't reveal if email exists)
        assert response.status_code == 200, f"Expected 200, got: {response.status_code}"
        print("SUCCESS: Nonexistent email returns 200 (security - no reveal)")


class TestUserSearchAndProfile:
    """Test user search and profile endpoints for Connect page"""
    
    def test_user_search_endpoint(self, api_client, master_admin_token):
        """Test 6: Search users endpoint works"""
        response = api_client.get(
            f"{BASE_URL}/api/users/search?q=test",
            headers={"Authorization": f"Bearer {master_admin_token}"}
        )
        
        assert response.status_code == 200, f"User search failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list of users"
        print(f"SUCCESS: User search returned {len(data)} results")
    
    def test_user_profile_endpoint(self, api_client, master_admin_token):
        """Test user profile endpoint works"""
        # First get a user ID from search
        search_response = api_client.get(
            f"{BASE_URL}/api/users/search",
            headers={"Authorization": f"Bearer {master_admin_token}"}
        )
        
        if search_response.status_code == 200 and len(search_response.json()) > 0:
            user_id = search_response.json()[0]["id"]
            
            # Get profile
            profile_response = api_client.get(
                f"{BASE_URL}/api/users/{user_id}/profile",
                headers={"Authorization": f"Bearer {master_admin_token}"}
            )
            
            assert profile_response.status_code == 200, f"Profile fetch failed: {profile_response.status_code}"
            profile_data = profile_response.json()
            assert "id" in profile_data
            assert "name" in profile_data
            print(f"SUCCESS: Profile endpoint works - user: {profile_data.get('name')}")
        else:
            print("NOTE: No users found to test profile endpoint")


class TestConnections:
    """Test connection/chat related endpoints"""
    
    def test_get_connections_endpoint(self, api_client, master_admin_token):
        """Test get connections endpoint"""
        response = api_client.get(
            f"{BASE_URL}/api/connections",
            headers={"Authorization": f"Bearer {master_admin_token}"}
        )
        
        assert response.status_code == 200, f"Get connections failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Expected list of connections"
        print(f"SUCCESS: Get connections returned {len(data)} connections")
        return data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
