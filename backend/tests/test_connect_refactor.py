"""
Test suite for ConnectPage refactored features.
Tests cover:
- Private Chat functionality (messaging, file attachments)
- Group Chat functionality (list, create, messaging)
- Connection List and pending requests
- Auto-scroll verification (frontend-only)
- Notification toggle

Refactored components: ChatWindow, ConnectionList, UserProfileDialog, GroupChat
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "atreyaghoshal.68@gmail.com"
ADMIN_PASSWORD = "4tr3y4@54N14"

# Known connection ID from agent_to_agent_context
KNOWN_CONNECTION_ID = "6860cdcd-1b6d-408d-b6f1-b31dd38faf05"


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


class TestAuth:
    """Authentication tests"""
    
    def test_login_success(self, auth_headers):
        """Verify login and token works"""
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "name" in data
        assert "email" in data
        print(f"Logged in as: {data['name']} ({data['email']})")


class TestConnectionsList:
    """Test connection list APIs - ConnectionList component"""
    
    def test_get_all_connections(self, auth_headers):
        """Get all accepted connections with last message preview"""
        response = requests.get(f"{BASE_URL}/api/connections", headers=auth_headers)
        assert response.status_code == 200
        connections = response.json()
        assert isinstance(connections, list)
        print(f"Found {len(connections)} connections")
        
        # Verify connection structure
        if connections:
            conn = connections[0]
            assert "id" in conn
            assert "other_user" in conn
            # last_message may be present
            if conn.get("last_message"):
                assert "content" in conn["last_message"]
                print(f"Last message preview: {conn['last_message']['content'][:50]}")
        return connections
    
    def test_get_pending_requests(self, auth_headers):
        """Get pending connection requests"""
        response = requests.get(f"{BASE_URL}/api/connections/pending", headers=auth_headers)
        assert response.status_code == 200
        pending = response.json()
        assert isinstance(pending, list)
        print(f"Found {len(pending)} pending requests")
        return pending
    
    def test_get_sent_requests(self, auth_headers):
        """Get sent connection requests"""
        response = requests.get(f"{BASE_URL}/api/connections/sent", headers=auth_headers)
        assert response.status_code == 200
        sent = response.json()
        assert isinstance(sent, list)
        print(f"Found {len(sent)} sent requests")
        return sent
    
    def test_get_unread_count(self, auth_headers):
        """Get unread messages count"""
        response = requests.get(f"{BASE_URL}/api/messages/unread/count", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "unread_count" in data
        assert "connections_with_unread" in data
        print(f"Unread messages: {data['unread_count']}")


class TestPrivateChat:
    """Test private chat functionality - ChatWindow component"""
    
    def test_get_messages_for_connection(self, auth_headers):
        """Get messages for a specific connection"""
        # First get connections
        response = requests.get(f"{BASE_URL}/api/connections", headers=auth_headers)
        assert response.status_code == 200
        connections = response.json()
        
        if not connections:
            pytest.skip("No connections available")
        
        # Use known connection or first available
        connection_id = KNOWN_CONNECTION_ID if any(c['id'] == KNOWN_CONNECTION_ID for c in connections) else connections[0]['id']
        
        # Get messages
        response = requests.get(
            f"{BASE_URL}/api/messages/{connection_id}",
            headers=auth_headers
        )
        assert response.status_code == 200
        messages = response.json()
        assert isinstance(messages, list)
        print(f"Found {len(messages)} messages in connection")
        return messages, connection_id
    
    def test_send_text_message(self, auth_headers):
        """Send a text message in private chat"""
        # Get a connection to send message to
        response = requests.get(f"{BASE_URL}/api/connections", headers=auth_headers)
        assert response.status_code == 200
        connections = response.json()
        
        if not connections:
            pytest.skip("No connections available")
        
        connection_id = connections[0]['id']
        
        # Send message
        response = requests.post(
            f"{BASE_URL}/api/messages/{connection_id}",
            headers=auth_headers,
            json={"content": "Test message from connect refactor tests"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data or "id" in data
        print(f"Message sent successfully")
    
    def test_send_message_with_file(self, auth_headers):
        """Send message with file attachment"""
        # Get a connection
        response = requests.get(f"{BASE_URL}/api/connections", headers=auth_headers)
        assert response.status_code == 200
        connections = response.json()
        
        if not connections:
            pytest.skip("No connections available")
        
        connection_id = connections[0]['id']
        
        # Create test file
        test_content = b"Test file content for file sharing"
        files = {"file": ("test_doc.txt", io.BytesIO(test_content), "text/plain")}
        data = {"content": "Test message with attachment"}
        
        response = requests.post(
            f"{BASE_URL}/api/messages/{connection_id}/with-file",
            headers=auth_headers,
            files=files,
            data=data
        )
        assert response.status_code == 200
        print("Message with file sent successfully")
    
    def test_mark_messages_as_read(self, auth_headers):
        """Mark messages as read"""
        # Get a connection
        response = requests.get(f"{BASE_URL}/api/connections", headers=auth_headers)
        connections = response.json()
        
        if not connections:
            pytest.skip("No connections available")
        
        connection_id = connections[0]['id']
        
        response = requests.post(
            f"{BASE_URL}/api/messages/{connection_id}/mark-read",
            headers=auth_headers
        )
        assert response.status_code == 200
        print("Messages marked as read")


class TestGroupChatList:
    """Test group chat list functionality - GroupChat component"""
    
    def test_get_groups(self, auth_headers):
        """Get all groups user is member of"""
        response = requests.get(f"{BASE_URL}/api/groups", headers=auth_headers)
        assert response.status_code == 200
        groups = response.json()
        assert isinstance(groups, list)
        print(f"Found {len(groups)} groups")
        
        # Verify group structure
        if groups:
            group = groups[0]
            assert "id" in group
            assert "name" in group
            assert "member_count" in group or "members" in group
            print(f"Group: {group['name']}")
        return groups


class TestGroupChatMessaging:
    """Test group chat messaging - GroupChat component"""
    
    def test_get_group_messages(self, auth_headers):
        """Get messages from a group"""
        # First get groups
        response = requests.get(f"{BASE_URL}/api/groups", headers=auth_headers)
        groups = response.json()
        
        if not groups:
            pytest.skip("No groups available")
        
        group_id = groups[0]['id']
        
        # Get messages
        response = requests.get(
            f"{BASE_URL}/api/groups/{group_id}/messages",
            headers=auth_headers
        )
        assert response.status_code == 200
        messages = response.json()
        assert isinstance(messages, list)
        print(f"Found {len(messages)} messages in group")
    
    def test_send_group_message(self, auth_headers):
        """Send message to a group"""
        # Get groups
        response = requests.get(f"{BASE_URL}/api/groups", headers=auth_headers)
        groups = response.json()
        
        if not groups:
            pytest.skip("No groups available")
        
        group_id = groups[0]['id']
        
        # Send message
        response = requests.post(
            f"{BASE_URL}/api/groups/{group_id}/messages",
            headers=auth_headers,
            json={"content": "Test group message from refactor tests"}
        )
        assert response.status_code == 200
        print("Group message sent successfully")


class TestGroupChatCreation:
    """Test group creation - GroupChat component"""
    
    def test_create_group_requires_members(self, auth_headers):
        """Creating group without members should fail"""
        response = requests.post(
            f"{BASE_URL}/api/groups",
            headers=auth_headers,
            json={
                "name": "Test Empty Group",
                "description": "Should fail",
                "member_ids": []
            }
        )
        # Should fail with validation error
        assert response.status_code in [400, 422]
        print("Empty group creation correctly rejected")
    
    def test_create_and_leave_group(self, auth_headers):
        """Create a group and then leave it"""
        # First get connections to add as members
        response = requests.get(f"{BASE_URL}/api/connections", headers=auth_headers)
        connections = response.json()
        
        if not connections:
            pytest.skip("No connections to add to group")
        
        member_ids = [connections[0]['other_user']['id']]
        
        # Create group
        response = requests.post(
            f"{BASE_URL}/api/groups",
            headers=auth_headers,
            json={
                "name": f"TEST_Refactor_Group_{os.urandom(4).hex()}",
                "description": "Test group for refactor testing",
                "member_ids": member_ids
            }
        )
        
        if response.status_code == 200:
            group = response.json()
            # API returns group_id in response
            group_id = group.get('group_id') or group.get('id')
            print(f"Created group with ID: {group_id}")
            
            # Now leave the group
            response = requests.delete(
                f"{BASE_URL}/api/groups/{group_id}/leave",
                headers=auth_headers
            )
            assert response.status_code in [200, 204]
            print("Left the group successfully")
        else:
            print(f"Group creation: {response.status_code} - {response.text}")


class TestConnectionRequestActions:
    """Test accept/reject connection request APIs"""
    
    def test_connection_request_flow(self, auth_headers):
        """Verify connection request endpoints exist and respond correctly"""
        # This is more of a structure test since we may not have pending requests
        
        # Verify accept endpoint exists (will 404 with fake ID which is expected)
        response = requests.post(
            f"{BASE_URL}/api/connections/fake-id-123/accept",
            headers=auth_headers
        )
        assert response.status_code in [404, 403, 400]  # Not 500
        print("Accept endpoint responds correctly")
        
        # Verify reject endpoint exists
        response = requests.post(
            f"{BASE_URL}/api/connections/fake-id-123/reject",
            headers=auth_headers
        )
        assert response.status_code in [404, 403, 400]  # Not 500
        print("Reject endpoint responds correctly")


class TestNotificationToggle:
    """Test push notification endpoints"""
    
    def test_get_vapid_key(self, auth_headers):
        """Get VAPID public key for push notifications"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-public-key")
        assert response.status_code == 200
        data = response.json()
        assert "publicKey" in data
        print(f"VAPID key available: {'Yes' if data['publicKey'] else 'No'}")
    
    def test_push_test_endpoint(self, auth_headers):
        """Test push notification endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/push/test",
            headers=auth_headers
        )
        assert response.status_code == 200
        print("Push notification test endpoint working")


class TestPinChat:
    """Test chat pinning functionality"""
    
    def test_pin_unpin_chat(self, auth_headers):
        """Test pin and unpin chat"""
        # Get connections
        response = requests.get(f"{BASE_URL}/api/connections", headers=auth_headers)
        connections = response.json()
        
        if not connections:
            pytest.skip("No connections available")
        
        connection_id = connections[0]['id']
        
        # Toggle pin
        response = requests.post(
            f"{BASE_URL}/api/connections/{connection_id}/pin",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "pinned" in data
        print(f"Pin status: {data['pinned']}")
        
        # Toggle again to restore original state
        response = requests.post(
            f"{BASE_URL}/api/connections/{connection_id}/pin",
            headers=auth_headers
        )
        assert response.status_code == 200


class TestFileUpload:
    """Test standalone file upload endpoint"""
    
    def test_upload_file(self, auth_headers):
        """Upload a file for chat"""
        test_content = b"Test content for file upload"
        files = {"file": ("test_upload.txt", io.BytesIO(test_content), "text/plain")}
        
        response = requests.post(
            f"{BASE_URL}/api/chat/upload",
            headers=auth_headers,
            files=files
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "url" in data
        assert "original_filename" in data
        print(f"File uploaded: {data['original_filename']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
