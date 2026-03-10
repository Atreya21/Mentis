"""
Comprehensive tests for Mentis Platform - Testing new features
Features:
1. Like and comment for ResourceHub and Curiofacts
2. User reporting feature
3. Reels section
4. Master Admin role
5. Mathmate chat features
6. Matrix page Organization label
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mentis-chat-fix.preview.emergentagent.com')

# Master Admin credentials
MASTER_ADMIN_EMAIL = "atreyaghoshal.68@gmail.com"
MASTER_ADMIN_PASSWORD = "4tr3y4@54N14"

# Test user credentials
TEST_USER_EMAIL = f"test_user_{uuid.uuid4().hex[:8]}@test.com"
TEST_USER_PASSWORD = "testpassword123"
TEST_USER_NAME = "TEST_USER"


@pytest.fixture(scope="module")
def master_admin_token():
    """Login as master admin and get token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": MASTER_ADMIN_EMAIL,
        "password": MASTER_ADMIN_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token")
    pytest.skip(f"Master admin login failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def master_admin_user(master_admin_token):
    """Get master admin user info"""
    response = requests.get(f"{BASE_URL}/api/auth/me", headers={
        "Authorization": f"Bearer {master_admin_token}"
    })
    if response.status_code == 200:
        return response.json()
    pytest.skip("Failed to get master admin user info")


@pytest.fixture(scope="module")
def test_user():
    """Create a test user and get token"""
    response = requests.post(f"{BASE_URL}/api/auth/signup", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD,
        "name": TEST_USER_NAME
    })
    if response.status_code == 200:
        return response.json()
    # Try login if user exists
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    if response.status_code == 200:
        return response.json()
    pytest.skip(f"Test user creation/login failed: {response.status_code}")


class TestMasterAdminFeatures:
    """Test Master Admin role and access"""
    
    def test_master_admin_login(self, master_admin_token):
        """Test master admin can login"""
        assert master_admin_token is not None
        print(f"✅ Master admin login successful")
    
    def test_master_admin_has_correct_role(self, master_admin_user):
        """Test master admin has master_admin role"""
        assert master_admin_user["role"] == "master_admin"
        print(f"✅ Master admin has role: {master_admin_user['role']}")
    
    def test_master_admin_can_access_admin_dashboard(self, master_admin_token):
        """Test master admin can access admin-only endpoints"""
        response = requests.get(f"{BASE_URL}/api/admin/users", headers={
            "Authorization": f"Bearer {master_admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Master admin can access admin users list - {len(data)} users found")
    
    def test_admin_can_access_pending_reels(self, master_admin_token):
        """Test admin can access pending reels endpoint"""
        response = requests.get(f"{BASE_URL}/api/reels/pending", headers={
            "Authorization": f"Bearer {master_admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Admin can access pending reels - {len(data)} pending reels")
    
    def test_admin_can_access_user_reports(self, master_admin_token):
        """Test admin can access user reports endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/reports", headers={
            "Authorization": f"Bearer {master_admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Admin can access user reports - {len(data)} reports")


class TestReelsFeature:
    """Test Reels section functionality"""
    
    def test_get_approved_reels(self, master_admin_token):
        """Test getting approved reels"""
        response = requests.get(f"{BASE_URL}/api/reels", headers={
            "Authorization": f"Bearer {master_admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} approved reels")
    
    def test_create_reel(self, master_admin_token):
        """Test creating a new reel"""
        reel_data = {
            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "video_type": "link",
            "caption": "TEST_REEL: Educational math video for testing"
        }
        response = requests.post(f"{BASE_URL}/api/reels", json=reel_data, headers={
            "Authorization": f"Bearer {master_admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "reel_id" in data
        print(f"✅ Reel created with id: {data['reel_id']}")
        return data["reel_id"]
    
    def test_like_reel(self, master_admin_token):
        """Test liking a reel"""
        # First create a reel
        reel_data = {
            "video_url": "https://www.youtube.com/watch?v=test123",
            "caption": "TEST_REEL: Test like functionality"
        }
        create_response = requests.post(f"{BASE_URL}/api/reels", json=reel_data, headers={
            "Authorization": f"Bearer {master_admin_token}"
        })
        if create_response.status_code == 200:
            reel_id = create_response.json()["reel_id"]
            
            # Like the reel
            response = requests.post(f"{BASE_URL}/api/reels/{reel_id}/like", headers={
                "Authorization": f"Bearer {master_admin_token}"
            })
            assert response.status_code == 200
            data = response.json()
            assert "liked" in data
            print(f"✅ Reel like functionality works - liked: {data['liked']}")


class TestLikeCommentFeatures:
    """Test Like and Comment features for Resources and Curiofacts"""
    
    def test_like_resource(self, master_admin_token):
        """Test liking a resource"""
        # Get resources first
        res = requests.get(f"{BASE_URL}/api/resources?status=approved")
        if res.status_code == 200 and len(res.json()) > 0:
            resource_id = res.json()[0]["id"]
            
            response = requests.post(f"{BASE_URL}/api/resources/{resource_id}/like", headers={
                "Authorization": f"Bearer {master_admin_token}"
            })
            assert response.status_code == 200
            data = response.json()
            assert "liked" in data
            print(f"✅ Resource like works - liked: {data['liked']}")
        else:
            pytest.skip("No approved resources to test like functionality")
    
    def test_get_resource_likes(self, master_admin_token):
        """Test getting likes for a resource"""
        res = requests.get(f"{BASE_URL}/api/resources?status=approved")
        if res.status_code == 200 and len(res.json()) > 0:
            resource_id = res.json()[0]["id"]
            
            response = requests.get(f"{BASE_URL}/api/resources/{resource_id}/likes", headers={
                "Authorization": f"Bearer {master_admin_token}"
            })
            assert response.status_code == 200
            data = response.json()
            assert "count" in data
            assert "likes" in data
            print(f"✅ Got likes for resource: {data['count']} likes")
        else:
            pytest.skip("No approved resources to test")
    
    def test_comment_on_resource(self, master_admin_token):
        """Test commenting on a resource"""
        res = requests.get(f"{BASE_URL}/api/resources?status=approved")
        if res.status_code == 200 and len(res.json()) > 0:
            resource_id = res.json()[0]["id"]
            
            response = requests.post(f"{BASE_URL}/api/resources/{resource_id}/comment", 
                json={"content": "TEST_COMMENT: Great resource!"},
                headers={"Authorization": f"Bearer {master_admin_token}"}
            )
            assert response.status_code == 200
            data = response.json()
            assert "comment_id" in data
            print(f"✅ Comment added with id: {data['comment_id']}")
        else:
            pytest.skip("No approved resources to test comment functionality")
    
    def test_get_resource_comments(self, master_admin_token):
        """Test getting comments for a resource"""
        res = requests.get(f"{BASE_URL}/api/resources?status=approved")
        if res.status_code == 200 and len(res.json()) > 0:
            resource_id = res.json()[0]["id"]
            
            response = requests.get(f"{BASE_URL}/api/resources/{resource_id}/comments")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            print(f"✅ Got {len(data)} comments for resource")
        else:
            pytest.skip("No approved resources to test")
    
    def test_like_curiofact(self, master_admin_token):
        """Test liking a curiofact"""
        res = requests.get(f"{BASE_URL}/api/curiofacts")
        if res.status_code == 200 and len(res.json()) > 0:
            fact_id = res.json()[0]["id"]
            
            response = requests.post(f"{BASE_URL}/api/curiofacts/{fact_id}/like", headers={
                "Authorization": f"Bearer {master_admin_token}"
            })
            assert response.status_code == 200
            data = response.json()
            assert "liked" in data
            print(f"✅ Curiofact like works - liked: {data['liked']}")
        else:
            pytest.skip("No curiofacts to test like functionality")


class TestUserReportFeature:
    """Test User Reporting functionality"""
    
    def test_report_user(self, master_admin_token, test_user):
        """Test reporting a user"""
        test_user_id = test_user["user"]["id"]
        
        # Master admin reports the test user
        report_data = {
            "reported_user_id": test_user_id,
            "reason": "spam",
            "description": "TEST_REPORT: This is a test report for testing purposes"
        }
        response = requests.post(f"{BASE_URL}/api/users/{test_user_id}/report", 
            json=report_data,
            headers={"Authorization": f"Bearer {master_admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "report_id" in data
        print(f"✅ User report created with id: {data['report_id']}")
    
    def test_cannot_report_self(self, master_admin_token, master_admin_user):
        """Test that user cannot report themselves"""
        user_id = master_admin_user["id"]
        report_data = {
            "reported_user_id": user_id,
            "reason": "spam",
            "description": "Self report test"
        }
        response = requests.post(f"{BASE_URL}/api/users/{user_id}/report",
            json=report_data,
            headers={"Authorization": f"Bearer {master_admin_token}"}
        )
        assert response.status_code == 400
        print(f"✅ Cannot report self - correctly returned 400")


class TestMatrixPage:
    """Test Matrix page functionality"""
    
    def test_matrix_stats(self):
        """Test matrix stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/matrix/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_members" in data
        assert "total_colleges" in data
        print(f"✅ Matrix stats: {data['total_members']} members, {data['total_colleges']} organizations")
    
    def test_matrix_registration(self):
        """Test matrix registration"""
        registration_data = {
            "name": "TEST USER",
            "email": f"test_{uuid.uuid4().hex[:8]}@test.com",
            "college": "TEST ORGANIZATION",
            "interests": "Mathematics, Testing"
        }
        response = requests.post(f"{BASE_URL}/api/matrix/register", json=registration_data)
        # Can be 200 (success) or 400 (email exists)
        assert response.status_code in [200, 400]
        if response.status_code == 200:
            print(f"✅ Matrix registration successful")
        else:
            print(f"✅ Matrix registration validation works (email might exist)")


class TestMathmateFeatures:
    """Test Mathmate (Connect) features"""
    
    def test_search_users(self, master_admin_token):
        """Test user search"""
        response = requests.get(f"{BASE_URL}/api/users/search", headers={
            "Authorization": f"Bearer {master_admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ User search works - found {len(data)} users")
    
    def test_get_colleges(self, master_admin_token):
        """Test getting colleges list"""
        response = requests.get(f"{BASE_URL}/api/users/colleges", headers={
            "Authorization": f"Bearer {master_admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} colleges/organizations")
    
    def test_get_connections(self, master_admin_token):
        """Test getting connections"""
        response = requests.get(f"{BASE_URL}/api/connections", headers={
            "Authorization": f"Bearer {master_admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} connections")
    
    def test_get_pending_requests(self, master_admin_token):
        """Test getting pending connection requests"""
        response = requests.get(f"{BASE_URL}/api/connections/pending", headers={
            "Authorization": f"Bearer {master_admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} pending connection requests")
    
    def test_get_pinned_chats(self, master_admin_token):
        """Test getting pinned chats"""
        response = requests.get(f"{BASE_URL}/api/connections/pinned", headers={
            "Authorization": f"Bearer {master_admin_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Got {len(data)} pinned chats")


class TestProtectedRoutes:
    """Test that protected routes require authentication"""
    
    def test_resources_public_get(self):
        """Test that resources GET is public"""
        response = requests.get(f"{BASE_URL}/api/resources?status=approved")
        assert response.status_code == 200
        print(f"✅ Resources GET is public")
    
    def test_reels_requires_auth(self):
        """Test that reels requires authentication"""
        response = requests.get(f"{BASE_URL}/api/reels")
        assert response.status_code in [401, 403]
        print(f"✅ Reels requires authentication - status: {response.status_code}")
    
    def test_mathmate_requires_auth(self):
        """Test that Mathmate features require authentication"""
        response = requests.get(f"{BASE_URL}/api/users/search")
        assert response.status_code in [401, 403]
        print(f"✅ User search requires authentication - status: {response.status_code}")
    
    def test_connections_requires_auth(self):
        """Test that connections require authentication"""
        response = requests.get(f"{BASE_URL}/api/connections")
        assert response.status_code in [401, 403]
        print(f"✅ Connections requires authentication - status: {response.status_code}")


class TestDemoteAdminFeature:
    """Test Master Admin demote feature"""
    
    def test_demote_endpoint_exists(self, master_admin_token):
        """Test that demote endpoint exists"""
        # Try to demote a non-existent user to verify endpoint works
        response = requests.patch(f"{BASE_URL}/api/master-admin/demote/non-existent-user", headers={
            "Authorization": f"Bearer {master_admin_token}"
        })
        # Should return 404 for non-existent user, not 500 or method not allowed
        assert response.status_code in [404, 400]
        print(f"✅ Demote endpoint exists and validates - status: {response.status_code}")
    
    def test_non_master_admin_cannot_demote(self, test_user):
        """Test that non-master admin cannot demote"""
        token = test_user["access_token"]
        response = requests.patch(f"{BASE_URL}/api/master-admin/demote/some-user", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 403
        print(f"✅ Non-master admin cannot demote - status: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
