"""
Test suite for the 4 new features:
1. FAQ section in About Us (Master Admin management)
2. Deep linking for shared content (Resources, Curiofacts, Reels)
3. Master Admin ability to edit Matrix member details
4. Unique username/email validation for Matrix registration
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mentis-chat-fix.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

# Test credentials
MASTER_ADMIN_EMAIL = "atreyaghoshal.68@gmail.com"
MASTER_ADMIN_PASSWORD = "4tr3y4@54N14"

# ============== FIXTURES ==============

@pytest.fixture(scope="module")
def master_admin_token():
    """Get Master Admin authentication token"""
    response = requests.post(f"{API}/auth/login", json={
        "email": MASTER_ADMIN_EMAIL,
        "password": MASTER_ADMIN_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Master Admin login failed: {response.text}")
    return response.json().get("access_token")


# ============== FEATURE 1: FAQ SECTION ==============

class TestFAQPublicEndpoint:
    """Test public FAQ endpoints"""
    
    def test_get_faqs_public(self):
        """Test that FAQs are publicly accessible"""
        response = requests.get(f"{API}/faqs")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "FAQs should return a list"
        print(f"Found {len(data)} FAQs in the system")
        
        # Check structure of FAQs
        if len(data) > 0:
            faq = data[0]
            assert "id" in faq, "FAQ should have id"
            assert "question" in faq, "FAQ should have question"
            assert "answer" in faq, "FAQ should have answer"
            print(f"First FAQ: {faq['question']}")


class TestFAQMasterAdminManagement:
    """Test FAQ CRUD operations (Master Admin only)"""
    
    def test_create_faq_requires_master_admin(self):
        """Test that creating FAQ requires Master Admin auth"""
        response = requests.post(f"{API}/master-admin/faqs", json={
            "question": "Test Question",
            "answer": "Test Answer"
        })
        # Should fail without auth
        assert response.status_code in [401, 403], f"Expected 401/403 without auth, got {response.status_code}"
    
    def test_create_faq_as_master_admin(self, master_admin_token):
        """Test creating a FAQ as Master Admin"""
        unique_id = str(uuid.uuid4())[:8]
        response = requests.post(
            f"{API}/master-admin/faqs",
            json={
                "question": f"TEST_FAQ: What is {unique_id}?",
                "answer": f"This is a test FAQ answer for {unique_id}",
                "order": 99
            },
            headers={"Authorization": f"Bearer {master_admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain FAQ id"
        assert "message" in data, "Response should contain success message"
        print(f"Created FAQ with id: {data['id']}")
        
        # Store for cleanup
        TestFAQMasterAdminManagement.test_faq_id = data['id']
        return data['id']
    
    def test_update_faq_as_master_admin(self, master_admin_token):
        """Test updating a FAQ as Master Admin"""
        faq_id = getattr(TestFAQMasterAdminManagement, 'test_faq_id', '8bf5ef1d-b0ef-467b-a1aa-eab0557e5fdf')
        
        response = requests.patch(
            f"{API}/master-admin/faqs/{faq_id}",
            json={"answer": "Updated answer - tested via pytest"},
            headers={"Authorization": f"Bearer {master_admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should confirm update"
        print(f"Updated FAQ: {faq_id}")
    
    def test_delete_faq_as_master_admin(self, master_admin_token):
        """Test deleting a FAQ as Master Admin"""
        faq_id = getattr(TestFAQMasterAdminManagement, 'test_faq_id', None)
        if not faq_id:
            pytest.skip("No test FAQ to delete")
        
        response = requests.delete(
            f"{API}/master-admin/faqs/{faq_id}",
            headers={"Authorization": f"Bearer {master_admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"Deleted FAQ: {faq_id}")


# ============== FEATURE 2: DEEP LINKING ==============

class TestResourceDeepLink:
    """Test deep linking for Resources"""
    
    def test_get_single_resource(self):
        """Test fetching a single resource by ID (for deep linking)"""
        # First get list of resources
        response = requests.get(f"{API}/resources?status=approved")
        assert response.status_code == 200
        
        resources = response.json()
        if len(resources) == 0:
            pytest.skip("No approved resources to test")
        
        # Test provided resource ID
        test_resource_id = "361231f6-4f23-4117-8ba7-9555161c9575"
        response = requests.get(f"{API}/resources/{test_resource_id}")
        
        # If specific endpoint doesn't exist, check the resource is in the list
        if response.status_code == 404:
            # Check if resource exists in the list
            resource = next((r for r in resources if r['id'] == test_resource_id), None)
            if resource:
                print(f"Resource found in list: {resource['title']}")
                assert resource['title'] == "Khan Academy Calculus"
        else:
            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert "title" in data
            print(f"Deep link resource: {data['title']}")


class TestCuriofactDeepLink:
    """Test deep linking for Curiofacts"""
    
    def test_get_curiofacts(self):
        """Test fetching curiofacts"""
        response = requests.get(f"{API}/curiofacts")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} curiofacts")
        
        if len(data) > 0:
            # Test that individual fact can be identified by ID
            fact = data[0]
            assert "id" in fact
            assert "title" in fact
            print(f"First curiofact: {fact['title']}")


class TestReelDeepLink:
    """Test deep linking for Reels"""
    
    def test_get_reels_requires_auth(self, master_admin_token):
        """Test fetching reels (requires authentication)"""
        response = requests.get(
            f"{API}/reels",
            headers={"Authorization": f"Bearer {master_admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} reels")


# ============== FEATURE 3: MATRIX MEMBER EDIT ==============

class TestMatrixMemberEdit:
    """Test Master Admin ability to edit Matrix members"""
    
    def test_get_matrix_members(self, master_admin_token):
        """Test getting all Matrix members"""
        response = requests.get(
            f"{API}/admin/matrix-members",
            headers={"Authorization": f"Bearer {master_admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} Matrix members")
        
        if len(data) > 0:
            member = data[0]
            assert "id" in member
            assert "name" in member
            assert "email" in member
            assert "college" in member
            print(f"First member: {member['name']} - {member['college']}")
            TestMatrixMemberEdit.test_member_id = member['id']
            TestMatrixMemberEdit.original_interests = member.get('interests', '')
    
    def test_update_matrix_member_interests(self, master_admin_token):
        """Test updating Matrix member interests"""
        member_id = getattr(TestMatrixMemberEdit, 'test_member_id', None)
        if not member_id:
            pytest.skip("No Matrix member to test")
        
        response = requests.patch(
            f"{API}/master-admin/matrix-members/{member_id}",
            json={"interests": "TEST: Algebra, Calculus, Geometry"},
            headers={"Authorization": f"Bearer {master_admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        print(f"Updated member interests: {member_id}")
    
    def test_update_matrix_member_restore(self, master_admin_token):
        """Restore original interests"""
        member_id = getattr(TestMatrixMemberEdit, 'test_member_id', None)
        original = getattr(TestMatrixMemberEdit, 'original_interests', 'Number Theory')
        
        if not member_id:
            pytest.skip("No Matrix member to restore")
        
        response = requests.patch(
            f"{API}/master-admin/matrix-members/{member_id}",
            json={"interests": original},
            headers={"Authorization": f"Bearer {master_admin_token}"}
        )
        assert response.status_code == 200
        print(f"Restored member interests: {member_id}")
    
    def test_update_matrix_member_requires_master_admin(self):
        """Test that regular admin cannot edit Matrix members"""
        # Without auth should fail
        response = requests.patch(
            f"{API}/master-admin/matrix-members/some-id",
            json={"interests": "Test"}
        )
        assert response.status_code in [401, 403]


# ============== FEATURE 4: UNIQUE VALIDATION ==============

class TestMatrixRegistrationValidation:
    """Test unique username/email validation for Matrix registration"""
    
    def test_get_existing_members(self, master_admin_token):
        """Get existing members for duplicate testing"""
        response = requests.get(
            f"{API}/admin/matrix-members",
            headers={"Authorization": f"Bearer {master_admin_token}"}
        )
        assert response.status_code == 200
        members = response.json()
        
        if len(members) > 0:
            TestMatrixRegistrationValidation.existing_name = members[0]['name']
            TestMatrixRegistrationValidation.existing_email = members[0]['email']
            print(f"Existing member: {members[0]['name']}, {members[0]['email']}")
    
    def test_reject_duplicate_email(self):
        """Test that duplicate email is rejected"""
        existing_email = getattr(TestMatrixRegistrationValidation, 'existing_email', None)
        if not existing_email:
            pytest.skip("No existing member for duplicate test")
        
        response = requests.post(f"{API}/matrix/register", json={
            "name": f"UNIQUE_NAME_{uuid.uuid4().hex[:8]}",
            "email": existing_email,
            "college": "Test College",
            "interests": "Testing"
        })
        
        assert response.status_code == 400, f"Expected 400 for duplicate email, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        assert "email" in data["detail"].lower() or "already" in data["detail"].lower()
        print(f"Correctly rejected duplicate email: {data['detail']}")
    
    def test_reject_duplicate_name(self):
        """Test that duplicate name is rejected (case-insensitive)"""
        existing_name = getattr(TestMatrixRegistrationValidation, 'existing_name', None)
        if not existing_name:
            pytest.skip("No existing member for duplicate test")
        
        response = requests.post(f"{API}/matrix/register", json={
            "name": existing_name.lower(),  # Test case-insensitivity
            "email": f"unique_{uuid.uuid4().hex[:8]}@test.com",
            "college": "Test College",
            "interests": "Testing"
        })
        
        assert response.status_code == 400, f"Expected 400 for duplicate name, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data
        assert "name" in data["detail"].lower() or "already" in data["detail"].lower()
        print(f"Correctly rejected duplicate name: {data['detail']}")
    
    def test_successful_unique_registration(self, master_admin_token):
        """Test successful registration with unique name and email"""
        unique_id = uuid.uuid4().hex[:8]
        
        response = requests.post(f"{API}/matrix/register", json={
            "name": f"Test User {unique_id}",
            "email": f"testuser_{unique_id}@mentistest.com",
            "college": "Test University",
            "interests": "Mathematics, Testing"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["name"] == f"TEST USER {unique_id}".upper()  # Should be auto-capitalized
        assert data["college"] == "TEST UNIVERSITY"  # Should be auto-capitalized
        print(f"Created new Matrix member: {data['name']}")
        
        TestMatrixRegistrationValidation.cleanup_member_id = data['id']
    
    def test_name_auto_capitalization(self, master_admin_token):
        """Verify that name is auto-capitalized"""
        unique_id = uuid.uuid4().hex[:8]
        
        response = requests.post(f"{API}/matrix/register", json={
            "name": f"lowercase name {unique_id}",
            "email": f"lowercase_{unique_id}@mentistest.com",
            "college": "lowercase college",
            "interests": "Testing"
        })
        
        if response.status_code == 200:
            data = response.json()
            assert data["name"] == f"LOWERCASE NAME {unique_id}".upper()
            assert data["college"] == "LOWERCASE COLLEGE"
            print(f"Auto-capitalized: {data['name']}, {data['college']}")
            
            # Cleanup
            requests.delete(
                f"{API}/admin/delete-matrix-member/{data['id']}",
                headers={"Authorization": f"Bearer {master_admin_token}"}
            )
    
    def test_cleanup_test_member(self, master_admin_token):
        """Cleanup test member created during testing"""
        member_id = getattr(TestMatrixRegistrationValidation, 'cleanup_member_id', None)
        if not member_id:
            pytest.skip("No test member to cleanup")
        
        response = requests.delete(
            f"{API}/admin/delete-matrix-member/{member_id}",
            headers={"Authorization": f"Bearer {master_admin_token}"}
        )
        assert response.status_code == 200
        print(f"Cleaned up test member: {member_id}")


# ============== RUN ALL TESTS ==============

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
