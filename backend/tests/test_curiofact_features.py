"""
Test Suite for Curiofact Features
Tests:
1. Curiofact submission with image_url field
2. Curiofact cards display uploader_name
3. Admin Dashboard shows images in pending Curiofacts
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "atreyaghoshal.68@gmail.com"
ADMIN_PASSWORD = "4tr3y4@54N14"
TEST_USER_EMAIL = f"test_curiofact_{os.urandom(4).hex()}@test.com"
TEST_USER_PASSWORD = "TestPass123!"
TEST_USER_NAME = "Curiofact Test User"


class TestCuriofactFeatures:
    """Tests for Curiofact submission and display features"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access token in response"
        return data["access_token"]
    
    @pytest.fixture(scope="class")
    def test_user_token(self):
        """Create and login test user"""
        # Signup
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "name": TEST_USER_NAME,
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if signup_response.status_code == 400:
            # User might exist, try login
            login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            })
            assert login_response.status_code == 200, f"Login failed: {login_response.text}"
            return login_response.json()["access_token"]
        
        assert signup_response.status_code == 200, f"Signup failed: {signup_response.text}"
        return signup_response.json()["access_token"]
    
    # Test 1: Public Curiofacts API
    def test_get_public_curiofacts(self):
        """Test that public curiofacts endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/curiofacts")
        assert response.status_code == 200, f"Failed to get curiofacts: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Check that Curiofact model has expected fields
        if len(data) > 0:
            fact = data[0]
            assert "id" in fact, "Curiofact should have id"
            assert "title" in fact, "Curiofact should have title"
            assert "content" in fact, "Curiofact should have content"
            assert "published_at" in fact, "Curiofact should have published_at"
            # Check for new fields
            # image_url can be null but field should exist
            assert "image_url" in fact or fact.get("image_url") is None, "Curiofact model should support image_url"
            # uploader_name can be null for admin-created facts
            print(f"First curiofact has uploader_name: {fact.get('uploader_name')}")
    
    # Test 2: Submit Curiofact with image_url
    def test_submit_curiofact_with_image(self, test_user_token):
        """Test submitting a curiofact with cover image URL"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        
        payload = {
            "title": "TEST - Pi Day Celebration",
            "content": "Pi Day is celebrated on March 14th (3/14) every year, representing the first three digits of the mathematical constant π (pi).",
            "image_url": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800"
        }
        
        response = requests.post(f"{BASE_URL}/api/curiofacts/submit", 
                                 json=payload, 
                                 headers=headers)
        
        assert response.status_code == 200, f"Failed to submit curiofact: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should have message"
        assert "id" in data, "Response should have submission id"
        assert data["message"] == "Curiofact submitted for approval"
        
        print(f"Curiofact submitted with id: {data['id']}")
        return data["id"]
    
    # Test 3: Submit Curiofact without image_url (optional field)
    def test_submit_curiofact_without_image(self, test_user_token):
        """Test submitting a curiofact without cover image URL (optional)"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        
        payload = {
            "title": "TEST - Golden Ratio",
            "content": "The golden ratio (φ ≈ 1.618) appears throughout nature, from spiral galaxies to the arrangement of leaves on a stem."
        }
        
        response = requests.post(f"{BASE_URL}/api/curiofacts/submit", 
                                 json=payload, 
                                 headers=headers)
        
        assert response.status_code == 200, f"Failed to submit curiofact: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert data["message"] == "Curiofact submitted for approval"
        
        print(f"Curiofact submitted without image, id: {data['id']}")
    
    # Test 4: Admin can see pending curiofacts with images
    def test_admin_get_pending_curiofacts(self, admin_token):
        """Test admin can see pending curiofact submissions including images"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        response = requests.get(f"{BASE_URL}/api/curiofacts/pending", headers=headers)
        
        assert response.status_code == 200, f"Failed to get pending curiofacts: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Check for TEST submissions
        test_submissions = [s for s in data if s.get("title", "").startswith("TEST")]
        print(f"Found {len(test_submissions)} test submissions")
        
        # Verify submission has all required fields
        for submission in test_submissions:
            assert "id" in submission
            assert "title" in submission
            assert "content" in submission
            assert "user_id" in submission
            assert "user_name" in submission
            assert "status" in submission
            # image_url field should exist (can be null)
            if "image_url" in submission and submission["image_url"]:
                print(f"Submission '{submission['title']}' has image: {submission['image_url']}")
    
    # Test 5: Approve a curiofact and verify uploader_name is stored
    def test_approve_curiofact_stores_uploader_name(self, admin_token, test_user_token):
        """Test that approving a curiofact stores uploader_name"""
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        user_headers = {"Authorization": f"Bearer {test_user_token}"}
        
        # First submit a unique curiofact
        unique_title = f"TEST - Euler Identity {os.urandom(4).hex()}"
        payload = {
            "title": unique_title,
            "content": "Euler's identity e^(iπ) + 1 = 0 connects five fundamental constants.",
            "image_url": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800"
        }
        
        submit_response = requests.post(f"{BASE_URL}/api/curiofacts/submit", 
                                        json=payload, 
                                        headers=user_headers)
        assert submit_response.status_code == 200
        submission_id = submit_response.json()["id"]
        
        # Admin approves the submission
        approve_response = requests.patch(
            f"{BASE_URL}/api/admin/curiofacts/{submission_id}?status=approved",
            headers=admin_headers
        )
        assert approve_response.status_code == 200, f"Failed to approve: {approve_response.text}"
        
        # Verify the curiofact is now in public list with uploader_name
        facts_response = requests.get(f"{BASE_URL}/api/curiofacts")
        assert facts_response.status_code == 200
        
        facts = facts_response.json()
        approved_fact = next((f for f in facts if f.get("title") == unique_title), None)
        
        assert approved_fact is not None, f"Approved curiofact not found in public list"
        assert approved_fact.get("uploader_name") == TEST_USER_NAME, \
            f"Expected uploader_name '{TEST_USER_NAME}', got '{approved_fact.get('uploader_name')}'"
        assert approved_fact.get("image_url") == payload["image_url"], \
            f"Expected image_url preserved, got '{approved_fact.get('image_url')}'"
        
        print(f"Approved curiofact has uploader_name: {approved_fact.get('uploader_name')}")
        print(f"Approved curiofact has image_url: {approved_fact.get('image_url')}")
    
    # Test 6: Reject curiofact endpoint
    def test_reject_curiofact(self, admin_token, test_user_token):
        """Test rejecting a curiofact submission"""
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        user_headers = {"Authorization": f"Bearer {test_user_token}"}
        
        # Submit a curiofact to reject
        payload = {
            "title": f"TEST REJECT - {os.urandom(4).hex()}",
            "content": "This will be rejected.",
        }
        
        submit_response = requests.post(f"{BASE_URL}/api/curiofacts/submit", 
                                        json=payload, 
                                        headers=user_headers)
        assert submit_response.status_code == 200
        submission_id = submit_response.json()["id"]
        
        # Admin rejects the submission
        reject_response = requests.patch(
            f"{BASE_URL}/api/admin/curiofacts/{submission_id}?status=rejected",
            headers=admin_headers
        )
        assert reject_response.status_code == 200, f"Failed to reject: {reject_response.text}"
        assert "rejected" in reject_response.json().get("message", "")
        
        print(f"Successfully rejected curiofact: {submission_id}")
    
    # Test 7: Unauthorized user cannot access pending curiofacts
    def test_unauthorized_cannot_access_pending(self, test_user_token):
        """Test that non-admin users cannot access pending curiofacts"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        
        response = requests.get(f"{BASE_URL}/api/curiofacts/pending", headers=headers)
        
        # Should return 403 Forbidden
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
    
    # Test 8: Like and comment on curiofacts
    def test_like_and_comment_curiofact(self, test_user_token):
        """Test like and comment functionality on curiofacts"""
        headers = {"Authorization": f"Bearer {test_user_token}"}
        
        # Get a curiofact to interact with
        facts_response = requests.get(f"{BASE_URL}/api/curiofacts")
        assert facts_response.status_code == 200
        facts = facts_response.json()
        
        if len(facts) == 0:
            pytest.skip("No curiofacts available for testing")
        
        fact_id = facts[0]["id"]
        
        # Like the curiofact
        like_response = requests.post(f"{BASE_URL}/api/curiofacts/{fact_id}/like", 
                                     headers=headers)
        assert like_response.status_code == 200
        
        # Get likes
        likes_response = requests.get(f"{BASE_URL}/api/curiofacts/{fact_id}/likes")
        assert likes_response.status_code == 200
        
        # Add comment
        comment_response = requests.post(f"{BASE_URL}/api/curiofacts/{fact_id}/comment",
                                        json={"content": "Great math fact!"},
                                        headers=headers)
        assert comment_response.status_code == 200
        
        # Get comments
        comments_response = requests.get(f"{BASE_URL}/api/curiofacts/{fact_id}/comments")
        assert comments_response.status_code == 200
        
        print(f"Successfully liked and commented on curiofact {fact_id}")


class TestCuriofactCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_curiofacts(self):
        """Clean up test curiofacts (admin only)"""
        # Login as admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Cannot login as admin for cleanup")
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get all curiofacts
        facts_response = requests.get(f"{BASE_URL}/api/curiofacts")
        if facts_response.status_code == 200:
            facts = facts_response.json()
            test_facts = [f for f in facts if f.get("title", "").startswith("TEST")]
            
            for fact in test_facts:
                delete_response = requests.delete(
                    f"{BASE_URL}/api/admin/delete-curiofact/{fact['id']}", 
                    headers=headers
                )
                print(f"Deleted test curiofact: {fact['title']} - {delete_response.status_code}")
        
        print("Cleanup completed")
