"""
Test About Us and Tutorials Features - Master Admin Management
Tests: About Us public page, Admin edit functionality, Tutorial CRUD
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://math-collab-space.preview.emergentagent.com')

# Test credentials
MASTER_ADMIN_EMAIL = "atreyaghoshal.68@gmail.com"
MASTER_ADMIN_PASSWORD = "4tr3y4@54N14"


class TestPublicAboutUs:
    """Test public About Us endpoint - accessible without authentication"""
    
    def test_get_about_us_content(self):
        """Test GET /api/about-us returns content"""
        response = requests.get(f"{BASE_URL}/api/about-us")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify required fields exist
        assert "id" in data, "Missing 'id' field"
        assert data["id"] == "about_us_main", "ID should be 'about_us_main'"
        
        # Verify structure fields exist (can be null)
        expected_fields = ["tagline", "community_info", "foundation_info", "vision", "mission", "values", "instructions"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ About Us content retrieved successfully with all expected fields")
    
    def test_get_tutorials_public(self):
        """Test GET /api/tutorials returns list (public)"""
        response = requests.get(f"{BASE_URL}/api/tutorials")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Tutorials should be a list"
        print(f"✓ Tutorials endpoint returns list with {len(data)} tutorials")


class TestMasterAdminAuth:
    """Test Master Admin authentication and role verification"""
    
    @pytest.fixture
    def master_admin_token(self):
        """Get Master Admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MASTER_ADMIN_EMAIL, "password": MASTER_ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.status_code}"
        data = response.json()
        assert data.get("user", {}).get("role") == "master_admin", "User is not master_admin"
        return data["access_token"]
    
    def test_master_admin_login(self, master_admin_token):
        """Test Master Admin can login and has correct role"""
        assert master_admin_token is not None, "Token should not be None"
        print(f"✓ Master Admin login successful, token obtained")


class TestAboutUsManagement:
    """Test About Us content management (Master Admin only)"""
    
    @pytest.fixture
    def auth_header(self):
        """Get Master Admin auth header"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MASTER_ADMIN_EMAIL, "password": MASTER_ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed"
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_update_about_us_tagline(self, auth_header):
        """Test Master Admin can update About Us tagline"""
        test_tagline = "TEST_TAGLINE: Mathematics for everyone!"
        
        response = requests.patch(
            f"{BASE_URL}/api/master-admin/about-us",
            headers=auth_header,
            json={"tagline": test_tagline}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify the change persisted
        get_response = requests.get(f"{BASE_URL}/api/about-us")
        assert get_response.status_code == 200
        data = get_response.json()
        assert data.get("tagline") == test_tagline, "Tagline not updated"
        
        print(f"✓ About Us tagline updated and persisted")
    
    def test_update_about_us_vision_mission_values(self, auth_header):
        """Test Master Admin can update vision, mission, values"""
        updates = {
            "vision": "TEST_VISION: A world of mathematical excellence",
            "mission": "TEST_MISSION: Empower students globally",
            "values": "TEST_VALUES: Integrity, Innovation, Inclusion"
        }
        
        response = requests.patch(
            f"{BASE_URL}/api/master-admin/about-us",
            headers=auth_header,
            json=updates
        )
        assert response.status_code == 200, f"Update failed: {response.status_code}"
        
        # Verify changes
        get_response = requests.get(f"{BASE_URL}/api/about-us")
        data = get_response.json()
        
        for key, value in updates.items():
            assert data.get(key) == value, f"{key} not updated correctly"
        
        print(f"✓ Vision, mission, values updated successfully")
    
    def test_update_about_us_community_info(self, auth_header):
        """Test Master Admin can update community info"""
        test_community = "TEST_COMMUNITY: Mentis is a vibrant community of math enthusiasts."
        
        response = requests.patch(
            f"{BASE_URL}/api/master-admin/about-us",
            headers=auth_header,
            json={"community_info": test_community}
        )
        assert response.status_code == 200
        
        # Verify
        get_response = requests.get(f"{BASE_URL}/api/about-us")
        data = get_response.json()
        assert data.get("community_info") == test_community
        
        print(f"✓ Community info updated successfully")
    
    def test_unauthorized_about_us_update(self):
        """Test non-master-admin cannot update About Us"""
        # Try without auth
        response = requests.patch(
            f"{BASE_URL}/api/master-admin/about-us",
            json={"tagline": "Unauthorized update"}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
        print(f"✓ Unauthorized About Us update correctly rejected")


class TestTutorialsCRUD:
    """Test Tutorial CRUD operations (Master Admin only)"""
    
    @pytest.fixture
    def auth_header(self):
        """Get Master Admin auth header"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MASTER_ADMIN_EMAIL, "password": MASTER_ADMIN_PASSWORD}
        )
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_create_tutorial(self, auth_header):
        """Test Master Admin can create a tutorial"""
        tutorial_data = {
            "title": "TEST_TUTORIAL: Getting Started",
            "description": "Learn how to use Mentis platform",
            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "order": 1
        }
        
        response = requests.post(
            f"{BASE_URL}/api/master-admin/tutorials",
            headers=auth_header,
            json=tutorial_data
        )
        assert response.status_code == 200, f"Create failed: {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain tutorial ID"
        
        # Verify in list
        list_response = requests.get(f"{BASE_URL}/api/tutorials")
        tutorials = list_response.json()
        tutorial_ids = [t.get("title") for t in tutorials]
        assert tutorial_data["title"] in tutorial_ids, "Created tutorial not found in list"
        
        print(f"✓ Tutorial created successfully with ID: {data.get('id')}")
        return data.get("id")
    
    def test_list_tutorials(self):
        """Test public can view tutorials list"""
        response = requests.get(f"{BASE_URL}/api/tutorials")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Check tutorial structure if any exist
        if data:
            tutorial = data[0]
            assert "id" in tutorial
            assert "title" in tutorial
            assert "video_url" in tutorial
        
        print(f"✓ Tutorials listed successfully, count: {len(data)}")
    
    def test_delete_tutorial(self, auth_header):
        """Test Master Admin can delete a tutorial"""
        # First create a tutorial to delete
        tutorial_data = {
            "title": "TEST_DELETE_TUTORIAL",
            "video_url": "https://www.youtube.com/watch?v=test123",
            "order": 999
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/master-admin/tutorials",
            headers=auth_header,
            json=tutorial_data
        )
        assert create_response.status_code == 200
        tutorial_id = create_response.json().get("id")
        
        # Now delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/master-admin/tutorials/{tutorial_id}",
            headers=auth_header
        )
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.status_code}"
        
        # Verify deletion
        list_response = requests.get(f"{BASE_URL}/api/tutorials")
        tutorials = list_response.json()
        tutorial_ids = [t.get("id") for t in tutorials]
        assert tutorial_id not in tutorial_ids, "Deleted tutorial still exists"
        
        print(f"✓ Tutorial deleted successfully")
    
    def test_unauthorized_tutorial_create(self):
        """Test non-master-admin cannot create tutorial"""
        response = requests.post(
            f"{BASE_URL}/api/master-admin/tutorials",
            json={
                "title": "Unauthorized Tutorial",
                "video_url": "https://youtube.com/test"
            }
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        
        print(f"✓ Unauthorized tutorial creation correctly rejected")


class TestCleanup:
    """Cleanup test data after tests"""
    
    @pytest.fixture
    def auth_header(self):
        """Get Master Admin auth header"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MASTER_ADMIN_EMAIL, "password": MASTER_ADMIN_PASSWORD}
        )
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_cleanup_test_tutorials(self, auth_header):
        """Clean up TEST_ prefixed tutorials"""
        response = requests.get(f"{BASE_URL}/api/tutorials")
        tutorials = response.json()
        
        deleted_count = 0
        for tutorial in tutorials:
            if tutorial.get("title", "").startswith("TEST_"):
                delete_response = requests.delete(
                    f"{BASE_URL}/api/master-admin/tutorials/{tutorial['id']}",
                    headers=auth_header
                )
                if delete_response.status_code == 200:
                    deleted_count += 1
        
        print(f"✓ Cleaned up {deleted_count} test tutorials")
    
    def test_reset_about_us_content(self, auth_header):
        """Reset About Us to default values"""
        default_content = {
            "tagline": "Empowering the mathematics community through collaboration and knowledge sharing",
            "vision": "To create a world where mathematical knowledge is accessible to everyone and mathematical thinking is celebrated.",
            "mission": "To build a supportive platform where mathematics enthusiasts can learn, share, and grow together.",
            "values": "Collaboration, curiosity, inclusivity, and the pursuit of mathematical excellence."
        }
        
        response = requests.patch(
            f"{BASE_URL}/api/master-admin/about-us",
            headers=auth_header,
            json=default_content
        )
        assert response.status_code == 200
        
        print(f"✓ About Us content reset to defaults")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
