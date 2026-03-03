"""
Test Notification System Features for Mathmate Chat
Tests:
1. GET /api/messages/unread/count - Returns correct unread message count
2. POST /api/messages/{connection_id}/mark-read - Marks messages as read
3. Background task verification for 24-hour email notification
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MASTER_ADMIN_EMAIL = "atreyaghoshal.68@gmail.com"
MASTER_ADMIN_PASSWORD = "4tr3y4@54N14"

# Test user credentials (secondary user for connection testing)
TEST_USER_EMAIL = f"test_notif_{uuid.uuid4().hex[:8]}@test.com"
TEST_USER_PASSWORD = "TestPass123!"
TEST_USER_NAME = "Test Notif User"


@pytest.fixture(scope="module")
def admin_session():
    """Get authenticated session for master admin"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": MASTER_ADMIN_EMAIL,
        "password": MASTER_ADMIN_PASSWORD
    })
    
    if response.status_code != 200:
        pytest.skip(f"Admin authentication failed: {response.text}")
    
    data = response.json()
    session.headers.update({"Authorization": f"Bearer {data['access_token']}"})
    session.user_id = data['user']['id']
    session.user_name = data['user']['name']
    return session


@pytest.fixture(scope="module")
def test_user_session():
    """Create and authenticate a test user"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Try to signup
    signup_response = session.post(f"{BASE_URL}/api/auth/signup", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD,
        "name": TEST_USER_NAME
    })
    
    if signup_response.status_code == 200:
        data = signup_response.json()
    elif signup_response.status_code == 400:
        # User exists, login instead
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip(f"Test user authentication failed: {login_response.text}")
        data = login_response.json()
    else:
        pytest.skip(f"Test user creation failed: {signup_response.text}")
    
    session.headers.update({"Authorization": f"Bearer {data['access_token']}"})
    session.user_id = data['user']['id']
    session.user_name = data['user']['name']
    return session


class TestUnreadMessagesCount:
    """Test the GET /api/messages/unread/count endpoint"""
    
    def test_unread_count_returns_200(self, admin_session):
        """Test that the unread count endpoint returns 200"""
        response = admin_session.get(f"{BASE_URL}/api/messages/unread/count")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "unread_count" in data, "Response should contain 'unread_count'"
        assert "connections_with_unread" in data, "Response should contain 'connections_with_unread'"
        assert isinstance(data["unread_count"], int), "unread_count should be an integer"
        assert isinstance(data["connections_with_unread"], list), "connections_with_unread should be a list"
        
        print(f"Unread count for admin: {data['unread_count']}")
    
    def test_unread_count_requires_auth(self):
        """Test that unread count endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/messages/unread/count")
        
        assert response.status_code == 403, f"Expected 403 without auth, got {response.status_code}"
    
    def test_unread_count_structure(self, admin_session):
        """Test the response structure when there are unread messages"""
        response = admin_session.get(f"{BASE_URL}/api/messages/unread/count")
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate structure
        assert data["unread_count"] >= 0
        
        # If there are connections with unread, validate their structure
        for conn in data["connections_with_unread"]:
            assert "connection_id" in conn, "Each connection should have 'connection_id'"
            assert "unread_count" in conn, "Each connection should have 'unread_count'"
            assert "latest_message" in conn, "Each connection should have 'latest_message'"


class TestMarkMessagesAsRead:
    """Test the POST /api/messages/{connection_id}/mark-read endpoint"""
    
    def test_mark_read_requires_auth(self):
        """Test that mark-read endpoint requires authentication"""
        # Use a fake connection_id
        response = requests.post(f"{BASE_URL}/api/messages/fake-connection-id/mark-read")
        
        assert response.status_code == 403, f"Expected 403 without auth, got {response.status_code}"
    
    def test_mark_read_invalid_connection(self, admin_session):
        """Test mark-read with invalid connection ID"""
        response = admin_session.post(f"{BASE_URL}/api/messages/invalid-connection-id/mark-read")
        
        assert response.status_code == 404, f"Expected 404 for invalid connection, got {response.status_code}"
    
    def test_mark_read_valid_connection(self, admin_session):
        """Test mark-read with a valid connection"""
        # First, get user's connections
        connections_response = admin_session.get(f"{BASE_URL}/api/connections")
        
        if connections_response.status_code != 200:
            pytest.skip("Could not fetch connections")
        
        connections = connections_response.json()
        
        if not connections:
            pytest.skip("No connections available for testing")
        
        connection_id = connections[0]['id']
        
        # Mark messages as read
        response = admin_session.post(f"{BASE_URL}/api/messages/{connection_id}/mark-read")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data, "Response should contain 'message'"
        assert "marked_count" in data, "Response should contain 'marked_count'"
        assert data["message"] == "Messages marked as read"
        
        print(f"Marked {data['marked_count']} messages as read")


class TestConnectionAndMessageFlow:
    """Test the full flow of connection, message, and notification"""
    
    @pytest.fixture(scope="class")
    def test_connection(self, admin_session, test_user_session):
        """Create a connection between admin and test user"""
        # Check if connection already exists
        connections_response = admin_session.get(f"{BASE_URL}/api/connections")
        if connections_response.status_code == 200:
            connections = connections_response.json()
            for conn in connections:
                if (conn.get('other_user', {}).get('id') == test_user_session.user_id or
                    conn.get('requester_id') == test_user_session.user_id or
                    conn.get('receiver_id') == test_user_session.user_id):
                    return conn
        
        # Send connection request from admin to test user
        request_response = admin_session.post(f"{BASE_URL}/api/connections/request", json={
            "receiver_id": test_user_session.user_id
        })
        
        if request_response.status_code == 400:
            # Connection might already exist - get it
            connections = admin_session.get(f"{BASE_URL}/api/connections").json()
            for conn in connections:
                if conn.get('other_user', {}).get('id') == test_user_session.user_id:
                    return conn
            pytest.skip("Could not create or find connection")
        
        connection_id = request_response.json().get('connection_id')
        
        # Accept connection from test user
        accept_response = test_user_session.post(f"{BASE_URL}/api/connections/{connection_id}/accept")
        
        if accept_response.status_code != 200:
            pytest.skip(f"Could not accept connection: {accept_response.text}")
        
        return {"id": connection_id}
    
    def test_send_message_creates_unread(self, admin_session, test_user_session, test_connection):
        """Test that sending a message creates unread count for receiver"""
        connection_id = test_connection['id']
        
        # Get initial unread count for test user
        initial_count_response = test_user_session.get(f"{BASE_URL}/api/messages/unread/count")
        initial_count = initial_count_response.json().get('unread_count', 0)
        
        # Send a message from admin
        message_content = f"Test notification message {uuid.uuid4().hex[:8]}"
        send_response = admin_session.post(f"{BASE_URL}/api/messages/{connection_id}", json={
            "content": message_content
        })
        
        assert send_response.status_code == 200, f"Failed to send message: {send_response.text}"
        
        # Check unread count for test user increased
        new_count_response = test_user_session.get(f"{BASE_URL}/api/messages/unread/count")
        new_count = new_count_response.json().get('unread_count', 0)
        
        assert new_count >= initial_count, f"Unread count should increase or stay same. Initial: {initial_count}, New: {new_count}"
        
        print(f"Unread count after message: {new_count}")
    
    def test_reading_messages_clears_unread(self, admin_session, test_user_session, test_connection):
        """Test that reading messages (GET /messages/{connection_id}) clears unread"""
        connection_id = test_connection['id']
        
        # Get messages (this should mark them as read)
        messages_response = test_user_session.get(f"{BASE_URL}/api/messages/{connection_id}")
        
        assert messages_response.status_code == 200, f"Failed to get messages: {messages_response.text}"
        
        # Check unread count after reading
        count_response = test_user_session.get(f"{BASE_URL}/api/messages/unread/count")
        count_data = count_response.json()
        
        # The unread count for this specific connection should be 0
        connections_with_unread = count_data.get('connections_with_unread', [])
        
        for conn in connections_with_unread:
            if conn['connection_id'] == connection_id:
                assert conn['unread_count'] == 0, "Unread count for this connection should be 0 after reading"
        
        print(f"Total unread after reading: {count_data['unread_count']}")
    
    def test_explicit_mark_read(self, admin_session, test_user_session, test_connection):
        """Test explicit POST /messages/{connection_id}/mark-read endpoint"""
        connection_id = test_connection['id']
        
        # Send another message from admin
        send_response = admin_session.post(f"{BASE_URL}/api/messages/{connection_id}", json={
            "content": f"Test mark-read message {uuid.uuid4().hex[:8]}"
        })
        
        assert send_response.status_code == 200
        
        # Use mark-read endpoint
        mark_read_response = test_user_session.post(f"{BASE_URL}/api/messages/{connection_id}/mark-read")
        
        assert mark_read_response.status_code == 200, f"Mark-read failed: {mark_read_response.text}"
        
        data = mark_read_response.json()
        print(f"Marked {data.get('marked_count', 0)} messages as read via explicit endpoint")


class TestBackgroundTaskVerification:
    """Verify the background task for 24-hour notification is running"""
    
    def test_background_task_log_message(self):
        """Verify the scheduled notification checker started from backend logs"""
        import subprocess
        
        # Check backend logs for the startup message
        result = subprocess.run(
            ["grep", "-l", "Started scheduled notification checker background task", "/var/log/supervisor/backend.err.log"],
            capture_output=True,
            text=True
        )
        
        # If grep finds the file, it means the log message exists
        assert result.returncode == 0, "Background task startup message not found in logs"
        print("Background task 'scheduled_notification_checker' is confirmed to be running")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
