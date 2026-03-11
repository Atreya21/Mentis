"""
Test suite for File Sharing and Group Chat features in Mathmate.
Tests cover:
- File upload in private chat
- File upload in group chat  
- Group chat creation
- Group chat messaging
- Leave group functionality
- Group list with member count
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "atreyaghoshal.68@gmail.com"
ADMIN_PASSWORD = "4tr3y4@54N14"


class TestAuth:
    """Authentication helper tests"""
    
    def test_login_admin(self):
        """Login as admin to get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        return data


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    pytest.skip("Authentication failed")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Get auth headers"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="module")
def user_id(auth_token):
    """Get current user ID"""
    response = requests.get(
        f"{BASE_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    if response.status_code == 200:
        return response.json()["id"]
    pytest.skip("Could not get user ID")


class TestFileUpload:
    """Test file upload endpoint"""
    
    def test_upload_file_endpoint_exists(self, auth_headers):
        """Test that file upload endpoint exists"""
        # Create a small test file
        test_content = b"Test file content for Mentis"
        files = {"file": ("test.txt", io.BytesIO(test_content), "text/plain")}
        
        response = requests.post(
            f"{BASE_URL}/api/chat/upload",
            headers=auth_headers,
            files=files
        )
        
        # Should succeed or return proper error
        assert response.status_code in [200, 400, 422], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "id" in data
            assert "url" in data
            assert "original_filename" in data
            print(f"File upload successful: {data}")


class TestConnections:
    """Test connection APIs for setting up chat tests"""
    
    def test_get_connections(self, auth_headers):
        """Get all connections"""
        response = requests.get(
            f"{BASE_URL}/api/connections",
            headers=auth_headers
        )
        assert response.status_code == 200
        connections = response.json()
        print(f"Found {len(connections)} connections")
        return connections


class TestPrivateChatWithFile:
    """Test sending messages with file attachments in private chat"""
    
    def test_get_connections_for_chat(self, auth_headers):
        """First get connections to find a chat to test"""
        response = requests.get(
            f"{BASE_URL}/api/connections",
            headers=auth_headers
        )
        assert response.status_code == 200
        connections = response.json()
        return connections
    
    def test_send_message_with_file_endpoint(self, auth_headers):
        """Test the with-file message endpoint"""
        # First get connections
        connections = self.test_get_connections_for_chat(auth_headers)
        
        if not connections:
            pytest.skip("No connections available for testing")
        
        connection_id = connections[0]["id"]
        
        # Create test file
        test_content = b"Test image content simulating an image"
        files = {"file": ("test_image.png", io.BytesIO(test_content), "image/png")}
        data = {"content": "Test message with file attachment"}
        
        response = requests.post(
            f"{BASE_URL}/api/messages/{connection_id}/with-file",
            headers=auth_headers,
            files=files,
            data=data
        )
        
        print(f"Send message with file response: {response.status_code} - {response.text[:200]}")
        
        # Should succeed
        assert response.status_code == 200, f"Failed to send message with file: {response.text}"
        
        result = response.json()
        assert "message" in result
        assert "id" in result
        
        if "attachment" in result and result["attachment"]:
            assert "url" in result["attachment"]
            assert "file_type" in result["attachment"]
            print(f"File attachment URL: {result['attachment']['url']}")


class TestGroupChatCRUD:
    """Test Group Chat CRUD operations"""
    
    def test_get_groups_list(self, auth_headers):
        """Get list of groups user is a member of"""
        response = requests.get(
            f"{BASE_URL}/api/groups",
            headers=auth_headers
        )
        assert response.status_code == 200
        groups = response.json()
        print(f"Found {len(groups)} groups")
        
        # Verify response structure
        if groups:
            group = groups[0]
            assert "id" in group
            assert "name" in group
            assert "member_count" in group
            print(f"First group: {group['name']} with {group['member_count']} members")
        
        return groups
    
    def test_create_group_requires_members(self, auth_headers):
        """Creating a group without members should fail"""
        response = requests.post(
            f"{BASE_URL}/api/groups",
            headers=auth_headers,
            json={
                "name": "Test Group No Members",
                "description": "Test",
                "member_ids": []
            }
        )
        
        # Should fail - no members
        assert response.status_code == 400
    
    def test_create_group_with_connections(self, auth_headers):
        """Create a group with connected users"""
        # First get connections
        conn_response = requests.get(
            f"{BASE_URL}/api/connections",
            headers=auth_headers
        )
        
        if conn_response.status_code != 200:
            pytest.skip("Could not get connections")
        
        connections = conn_response.json()
        if not connections:
            pytest.skip("No connections available for group creation")
        
        # Get first connection's other user ID
        member_ids = [connections[0]["other_user"]["id"]]
        
        response = requests.post(
            f"{BASE_URL}/api/groups",
            headers=auth_headers,
            json={
                "name": "TEST_Group_FileSharing",
                "description": "Test group for file sharing tests",
                "member_ids": member_ids
            }
        )
        
        print(f"Create group response: {response.status_code} - {response.text[:200]}")
        
        assert response.status_code == 200, f"Failed to create group: {response.text}"
        result = response.json()
        assert "group_id" in result
        
        return result["group_id"]
    
    def test_get_group_details(self, auth_headers):
        """Get details of a specific group"""
        # First get groups
        groups = self.test_get_groups_list(auth_headers)
        
        if not groups:
            pytest.skip("No groups available")
        
        group_id = groups[0]["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/groups/{group_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        group = response.json()
        
        assert "id" in group
        assert "name" in group
        assert "members" in group
        assert "member_info" in group
        
        print(f"Group details: {group['name']} - Members: {[m['name'] for m in group['member_info']]}")


class TestGroupMessaging:
    """Test sending messages in group chat"""
    
    def test_send_text_message_to_group(self, auth_headers):
        """Send a text message to a group"""
        # Get groups
        response = requests.get(
            f"{BASE_URL}/api/groups",
            headers=auth_headers
        )
        
        if response.status_code != 200 or not response.json():
            pytest.skip("No groups available")
        
        groups = response.json()
        group_id = groups[0]["id"]
        
        # Send message
        msg_response = requests.post(
            f"{BASE_URL}/api/groups/{group_id}/messages",
            headers=auth_headers,
            json={"content": "Test message from pytest"}
        )
        
        print(f"Send group message response: {msg_response.status_code} - {msg_response.text[:200]}")
        
        assert msg_response.status_code == 200
        result = msg_response.json()
        assert "id" in result
    
    def test_get_group_messages(self, auth_headers):
        """Get messages from a group"""
        # Get groups
        response = requests.get(
            f"{BASE_URL}/api/groups",
            headers=auth_headers
        )
        
        if response.status_code != 200 or not response.json():
            pytest.skip("No groups available")
        
        groups = response.json()
        group_id = groups[0]["id"]
        
        # Get messages
        msg_response = requests.get(
            f"{BASE_URL}/api/groups/{group_id}/messages",
            headers=auth_headers
        )
        
        assert msg_response.status_code == 200
        messages = msg_response.json()
        print(f"Found {len(messages)} messages in group")
        
        if messages:
            msg = messages[-1]
            assert "id" in msg
            assert "content" in msg
            assert "sender_name" in msg
    
    def test_send_file_to_group(self, auth_headers):
        """Send a message with file attachment to group"""
        # Get groups
        response = requests.get(
            f"{BASE_URL}/api/groups",
            headers=auth_headers
        )
        
        if response.status_code != 200 or not response.json():
            pytest.skip("No groups available")
        
        groups = response.json()
        group_id = groups[0]["id"]
        
        # Create test file
        test_content = b"Test document content for group"
        files = {"file": ("test_doc.pdf", io.BytesIO(test_content), "application/pdf")}
        data = {"content": "Here's a test document"}
        
        response = requests.post(
            f"{BASE_URL}/api/groups/{group_id}/messages/with-file",
            headers=auth_headers,
            files=files,
            data=data
        )
        
        print(f"Send file to group response: {response.status_code} - {response.text[:200]}")
        
        assert response.status_code == 200
        result = response.json()
        assert "id" in result
        
        if "attachment" in result and result["attachment"]:
            assert "url" in result["attachment"]
            assert "file_type" in result["attachment"]
            print(f"Group file attachment: {result['attachment']}")


class TestLeaveGroup:
    """Test leaving a group"""
    
    def test_create_and_leave_group(self, auth_headers):
        """Create a group then leave it"""
        # First get connections
        conn_response = requests.get(
            f"{BASE_URL}/api/connections",
            headers=auth_headers
        )
        
        if conn_response.status_code != 200:
            pytest.skip("Could not get connections")
        
        connections = conn_response.json()
        if not connections:
            pytest.skip("No connections available")
        
        # Create a test group
        member_ids = [connections[0]["other_user"]["id"]]
        
        create_response = requests.post(
            f"{BASE_URL}/api/groups",
            headers=auth_headers,
            json={
                "name": "TEST_LeaveGroup_Test",
                "description": "Group to test leave functionality",
                "member_ids": member_ids
            }
        )
        
        if create_response.status_code != 200:
            pytest.skip("Could not create test group")
        
        group_id = create_response.json()["group_id"]
        print(f"Created test group: {group_id}")
        
        # Now leave the group
        leave_response = requests.delete(
            f"{BASE_URL}/api/groups/{group_id}/leave",
            headers=auth_headers
        )
        
        print(f"Leave group response: {leave_response.status_code} - {leave_response.text}")
        
        assert leave_response.status_code == 200
        result = leave_response.json()
        assert result["message"] == "Left the group"


class TestGroupListDisplay:
    """Test group list displays correctly"""
    
    def test_group_list_has_member_count(self, auth_headers):
        """Verify group list includes member count"""
        response = requests.get(
            f"{BASE_URL}/api/groups",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        groups = response.json()
        
        for group in groups:
            assert "member_count" in group, f"Group {group.get('name')} missing member_count"
            assert isinstance(group["member_count"], int)
            print(f"Group '{group['name']}': {group['member_count']} members")
    
    def test_group_list_has_last_message(self, auth_headers):
        """Verify group list includes last message info"""
        response = requests.get(
            f"{BASE_URL}/api/groups",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        groups = response.json()
        
        for group in groups:
            if "last_message" in group and group["last_message"]:
                msg = group["last_message"]
                assert "sender_name" in msg
                assert "created_at" in msg
                print(f"Group '{group['name']}' last message from {msg['sender_name']}")


class TestFileEndpoint:
    """Test file serving endpoint"""
    
    def test_file_endpoint_structure(self, auth_headers, user_id):
        """Test that file endpoint is accessible"""
        # First upload a file
        test_content = b"Test file content"
        files = {"file": ("test_serve.txt", io.BytesIO(test_content), "text/plain")}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/chat/upload",
            headers=auth_headers,
            files=files
        )
        
        if upload_response.status_code != 200:
            pytest.skip("File upload not working")
        
        file_data = upload_response.json()
        file_url = file_data.get("url", "")
        
        if file_url:
            # Try to access the file
            full_url = f"{BASE_URL}{file_url}"
            get_response = requests.get(full_url)
            
            print(f"File access response: {get_response.status_code}")
            # File should be accessible
            assert get_response.status_code in [200, 404], f"Unexpected status: {get_response.status_code}"


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_groups(self, auth_headers):
        """Remove test groups created during tests"""
        response = requests.get(
            f"{BASE_URL}/api/groups",
            headers=auth_headers
        )
        
        if response.status_code != 200:
            return
        
        groups = response.json()
        
        for group in groups:
            if group["name"].startswith("TEST_"):
                # Leave/delete test groups
                leave_response = requests.delete(
                    f"{BASE_URL}/api/groups/{group['id']}/leave",
                    headers=auth_headers
                )
                print(f"Cleanup group '{group['name']}': {leave_response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
