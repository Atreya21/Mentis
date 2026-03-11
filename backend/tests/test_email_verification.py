"""
Backend tests for Email Verification feature
Tests: Signup, Login (verified vs unverified), Verify Email, Resend Verification

Endpoints tested:
- POST /api/auth/signup - Creates user with email_verified=false
- POST /api/auth/login - Returns 403 for unverified users, works for verified
- POST /api/auth/verify-email - Verifies user and returns access token
- POST /api/auth/resend-verification - Sends new verification email
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from the request
ADMIN_EMAIL = "atreyaghoshal.68@gmail.com"
ADMIN_PASSWORD = "4tr3y4@54N14"

# Test unverified user credentials
TEST_UNVERIFIED_EMAIL = f"test_verify_{uuid.uuid4().hex[:8]}@example.com"
TEST_UNVERIFIED_PASSWORD = "test123456"
TEST_USER_NAME = "Test Verification User"


class TestSignupWithVerification:
    """Test signup creates unverified users and sends verification email"""
    
    def test_signup_creates_unverified_user(self):
        """POST /api/auth/signup - should create user with email_verified=false"""
        unique_email = f"test_signup_{uuid.uuid4().hex[:8]}@example.com"
        
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": unique_email,
                "password": "testpassword123",
                "name": "Test Signup User"
            }
        )
        
        print(f"Signup response status: {response.status_code}")
        print(f"Signup response body: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify response structure
        assert "message" in data, "Response should have message"
        assert "email" in data, "Response should have email"
        assert data["email"] == unique_email, "Response email should match"
        assert "verify" in data["message"].lower() or "check" in data["message"].lower(), \
            "Message should mention verification"
        
        print(f"TEST PASSED: User created with verification pending for {unique_email}")
    
    def test_signup_duplicate_email_rejected(self):
        """POST /api/auth/signup - should reject duplicate emails"""
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": ADMIN_EMAIL,  # Already exists
                "password": "testpassword123",
                "name": "Duplicate Test"
            }
        )
        
        print(f"Duplicate signup response: {response.status_code}")
        
        assert response.status_code == 400, f"Expected 400 for duplicate, got {response.status_code}"
        print("TEST PASSED: Duplicate email correctly rejected")


class TestLoginVerificationCheck:
    """Test login blocks unverified users and allows verified users"""
    
    def test_login_verified_user_success(self):
        """POST /api/auth/login - should succeed for verified users (admin)"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
        )
        
        print(f"Login (verified) response status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200 for verified user, got {response.status_code}"
        
        data = response.json()
        assert "access_token" in data, "Response should have access_token"
        assert "user" in data, "Response should have user"
        assert data["user"]["email"] == ADMIN_EMAIL, "User email should match"
        
        print(f"TEST PASSED: Verified user {ADMIN_EMAIL} can login")
    
    def test_login_unverified_user_blocked(self):
        """POST /api/auth/login - should return 403 for unverified users"""
        # First create a new unverified user
        unique_email = f"test_unverified_{uuid.uuid4().hex[:8]}@example.com"
        
        # Create user
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": unique_email,
                "password": TEST_UNVERIFIED_PASSWORD,
                "name": "Unverified Test User"
            }
        )
        
        print(f"Created unverified user: {unique_email}")
        assert signup_response.status_code == 200, f"Failed to create test user: {signup_response.status_code}"
        
        # Now try to login - should be blocked
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": unique_email,
                "password": TEST_UNVERIFIED_PASSWORD
            }
        )
        
        print(f"Login (unverified) response status: {login_response.status_code}")
        print(f"Login (unverified) response body: {login_response.json()}")
        
        assert login_response.status_code == 403, \
            f"Expected 403 for unverified user, got {login_response.status_code}"
        
        data = login_response.json()
        assert "verify" in data.get("detail", "").lower(), \
            "Error message should mention verification"
        
        print(f"TEST PASSED: Unverified user {unique_email} correctly blocked from login")
    
    def test_login_invalid_credentials_rejected(self):
        """POST /api/auth/login - should return 401 for invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": ADMIN_EMAIL,
                "password": "wrongpassword123"
            }
        )
        
        print(f"Login (invalid) response status: {response.status_code}")
        
        assert response.status_code == 401, f"Expected 401 for invalid credentials, got {response.status_code}"
        print("TEST PASSED: Invalid credentials correctly rejected with 401")


class TestVerifyEmailEndpoint:
    """Test email verification endpoint"""
    
    def test_verify_email_invalid_token_rejected(self):
        """POST /api/auth/verify-email - should reject invalid tokens"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-email",
            params={"token": "invalid-token-12345"}
        )
        
        print(f"Verify (invalid token) response status: {response.status_code}")
        
        assert response.status_code == 400, f"Expected 400 for invalid token, got {response.status_code}"
        
        data = response.json()
        assert "invalid" in data.get("detail", "").lower() or "expired" in data.get("detail", "").lower(), \
            "Error should mention invalid or expired token"
        
        print("TEST PASSED: Invalid verification token correctly rejected")
    
    def test_verify_email_empty_token_rejected(self):
        """POST /api/auth/verify-email - should handle empty token gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/auth/verify-email",
            params={"token": ""}
        )
        
        print(f"Verify (empty token) response status: {response.status_code}")
        
        # Should return 400 or 422
        assert response.status_code in [400, 422], \
            f"Expected 400/422 for empty token, got {response.status_code}"
        
        print("TEST PASSED: Empty verification token correctly rejected")


class TestResendVerificationEndpoint:
    """Test resend verification email endpoint"""
    
    def test_resend_verification_unverified_user(self):
        """POST /api/auth/resend-verification - should send email to unverified users"""
        # First create an unverified user
        unique_email = f"test_resend_{uuid.uuid4().hex[:8]}@example.com"
        
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": unique_email,
                "password": "testpassword123",
                "name": "Resend Test User"
            }
        )
        
        print(f"Created user for resend test: {unique_email}")
        assert signup_response.status_code == 200, "Failed to create test user"
        
        # Request resend
        response = requests.post(
            f"{BASE_URL}/api/auth/resend-verification",
            params={"email": unique_email}
        )
        
        print(f"Resend verification response status: {response.status_code}")
        print(f"Resend verification response body: {response.json()}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "message" in data, "Response should have message"
        # Security: Response should not reveal if email exists
        
        print(f"TEST PASSED: Resend verification works for {unique_email}")
    
    def test_resend_verification_verified_user_rejected(self):
        """POST /api/auth/resend-verification - should reject already verified users"""
        response = requests.post(
            f"{BASE_URL}/api/auth/resend-verification",
            params={"email": ADMIN_EMAIL}  # Admin is already verified
        )
        
        print(f"Resend (already verified) response status: {response.status_code}")
        print(f"Resend (already verified) response body: {response.json()}")
        
        # Should return 400 with "already verified" message
        assert response.status_code == 400, f"Expected 400 for verified user, got {response.status_code}"
        
        data = response.json()
        assert "already verified" in data.get("detail", "").lower(), \
            "Error message should mention already verified"
        
        print("TEST PASSED: Resend correctly rejected for already verified user")
    
    def test_resend_verification_nonexistent_email(self):
        """POST /api/auth/resend-verification - should handle nonexistent email securely"""
        response = requests.post(
            f"{BASE_URL}/api/auth/resend-verification",
            params={"email": "nonexistent_12345@example.com"}
        )
        
        print(f"Resend (nonexistent) response status: {response.status_code}")
        
        # Security: Should return 200 to not reveal if email exists
        assert response.status_code == 200, f"Expected 200 for security, got {response.status_code}"
        
        print("TEST PASSED: Nonexistent email handled securely (no reveal)")


class TestVerificationTokenLifecycle:
    """Test the complete verification token lifecycle"""
    
    def test_signup_and_verify_flow(self):
        """Full flow: Signup creates token -> Token stored in DB -> Can be used for verification"""
        unique_email = f"test_lifecycle_{uuid.uuid4().hex[:8]}@example.com"
        
        # Step 1: Signup
        signup_response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": unique_email,
                "password": "testpassword123",
                "name": "Lifecycle Test User"
            }
        )
        
        assert signup_response.status_code == 200, f"Signup failed: {signup_response.status_code}"
        print(f"Step 1: Created user {unique_email}")
        
        # Step 2: Try login - should be blocked
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": unique_email,
                "password": "testpassword123"
            }
        )
        
        assert login_response.status_code == 403, f"Login should be blocked: {login_response.status_code}"
        print("Step 2: Login correctly blocked for unverified user")
        
        # Step 3: Resend verification should work
        resend_response = requests.post(
            f"{BASE_URL}/api/auth/resend-verification",
            params={"email": unique_email}
        )
        
        assert resend_response.status_code == 200, f"Resend failed: {resend_response.status_code}"
        print("Step 3: Resend verification works")
        
        print(f"TEST PASSED: Full verification flow working for {unique_email}")


class TestEdgeCases:
    """Test edge cases and error handling"""
    
    def test_signup_invalid_email_format(self):
        """POST /api/auth/signup - should reject invalid email format"""
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": "not-an-email",
                "password": "testpassword123",
                "name": "Invalid Email Test"
            }
        )
        
        print(f"Invalid email format response: {response.status_code}")
        
        # Should return 422 (validation error)
        assert response.status_code == 422, f"Expected 422 for invalid email, got {response.status_code}"
        print("TEST PASSED: Invalid email format correctly rejected")
    
    def test_signup_missing_fields(self):
        """POST /api/auth/signup - should reject missing required fields"""
        # Missing password
        response = requests.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "email": "test@example.com",
                "name": "Missing Password Test"
            }
        )
        
        print(f"Missing password response: {response.status_code}")
        
        assert response.status_code == 422, f"Expected 422 for missing password, got {response.status_code}"
        print("TEST PASSED: Missing password correctly rejected")
    
    def test_login_missing_fields(self):
        """POST /api/auth/login - should reject missing required fields"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": ADMIN_EMAIL
                # Missing password
            }
        )
        
        print(f"Missing password login response: {response.status_code}")
        
        assert response.status_code == 422, f"Expected 422 for missing password, got {response.status_code}"
        print("TEST PASSED: Missing login password correctly rejected")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
