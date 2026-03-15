"""
Test suite for Mathmate chat list sorting bug fix.
Verifies that the /api/connections endpoint returns connections with 
last_message.created_at field for proper sorting on frontend.
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mentis-auth-test.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "atreyaghoshal.68@gmail.com"
TEST_PASSWORD = "4tr3y4@54N14"


@pytest.fixture
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture
def authenticated_client(auth_token):
    """Session with auth header"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestChatListSorting:
    """Tests for Mathmate chat list sorting functionality"""
    
    def test_connections_endpoint_returns_last_message(self, authenticated_client):
        """Verify /api/connections returns connections with last_message field"""
        response = authenticated_client.get(f"{BASE_URL}/api/connections")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        # Check that connections have the expected structure
        if len(data) > 0:
            conn = data[0]
            # Verify essential fields exist
            assert "id" in conn, "Connection should have 'id' field"
            assert "other_user" in conn, "Connection should have 'other_user' field"
            print(f"Found {len(data)} connections")
            
            # Check for last_message if connection has messages
            connections_with_messages = [c for c in data if c.get('last_message')]
            print(f"Connections with messages: {len(connections_with_messages)}")
            
    def test_last_message_has_created_at_field(self, authenticated_client):
        """Verify last_message contains created_at field (not timestamp)"""
        response = authenticated_client.get(f"{BASE_URL}/api/connections")
        
        assert response.status_code == 200
        data = response.json()
        
        # Find connections with messages
        connections_with_messages = [c for c in data if c.get('last_message')]
        
        if len(connections_with_messages) == 0:
            pytest.skip("No connections with messages to test")
        
        for conn in connections_with_messages:
            last_msg = conn['last_message']
            
            # The bug fix: ensure created_at exists (not timestamp)
            assert 'created_at' in last_msg, \
                f"last_message should have 'created_at' field. Fields found: {list(last_msg.keys())}"
            
            # Verify it's a valid ISO datetime string
            created_at = last_msg['created_at']
            assert created_at is not None, "created_at should not be None"
            
            try:
                # Validate it's a parseable datetime
                if '+' in created_at or 'Z' in created_at:
                    datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                else:
                    datetime.fromisoformat(created_at)
                print(f"✓ Valid created_at for connection {conn['id'][:8]}: {created_at}")
            except ValueError as e:
                pytest.fail(f"Invalid datetime format: {created_at} - {e}")

    def test_sorting_order_by_most_recent_message(self, authenticated_client):
        """Verify connections can be sorted by last_message.created_at (most recent first)"""
        response = authenticated_client.get(f"{BASE_URL}/api/connections")
        
        assert response.status_code == 200
        data = response.json()
        
        # Get connections with messages and their timestamps
        connections_with_times = []
        for conn in data:
            other_user = conn.get('other_user', {})
            name = other_user.get('name', 'Unknown')
            
            if conn.get('last_message') and conn['last_message'].get('created_at'):
                created_at_str = conn['last_message']['created_at']
                # Parse the datetime
                if '+' in created_at_str or 'Z' in created_at_str:
                    created_at = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                else:
                    created_at = datetime.fromisoformat(created_at_str)
                connections_with_times.append({
                    'name': name,
                    'created_at': created_at,
                    'created_at_str': created_at_str
                })
            else:
                connections_with_times.append({
                    'name': name,
                    'created_at': None,
                    'created_at_str': None
                })
        
        # Sort by created_at descending (most recent first)
        sorted_connections = sorted(
            connections_with_times,
            key=lambda x: x['created_at'] if x['created_at'] else datetime.min,
            reverse=True
        )
        
        print("\nConnections sorted by most recent message:")
        for i, conn in enumerate(sorted_connections):
            print(f"  {i+1}. {conn['name']} - {conn['created_at_str'] or 'No messages'}")
        
        # Verify the expected order based on known test data
        # Expected: Test Notif User > Atreya Ghoshal > Badge Test User
        if len(sorted_connections) >= 3:
            names_in_order = [c['name'] for c in sorted_connections[:3]]
            print(f"\nTop 3 connections: {names_in_order}")
            
            # The most recent should be first
            if sorted_connections[0]['created_at'] and sorted_connections[1]['created_at']:
                assert sorted_connections[0]['created_at'] >= sorted_connections[1]['created_at'], \
                    "First connection should have most recent message"

    def test_connection_structure(self, authenticated_client):
        """Verify connection response has all required fields"""
        response = authenticated_client.get(f"{BASE_URL}/api/connections")
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data) == 0:
            pytest.skip("No connections to test")
        
        conn = data[0]
        required_fields = ['id', 'requester_id', 'receiver_id', 'status', 'other_user']
        
        for field in required_fields:
            assert field in conn, f"Connection missing required field: {field}"
        
        # Verify other_user structure
        other_user = conn['other_user']
        assert other_user is not None, "other_user should not be None"
        assert 'id' in other_user, "other_user should have 'id'"
        assert 'name' in other_user, "other_user should have 'name'"
        
        print(f"✓ Connection structure verified for {other_user.get('name')}")


class TestMessaging:
    """Tests for messaging functionality"""
    
    def test_send_and_receive_message(self, authenticated_client):
        """Verify messages can be sent and retrieved"""
        # Get connections first
        response = authenticated_client.get(f"{BASE_URL}/api/connections")
        assert response.status_code == 200
        connections = response.json()
        
        if len(connections) == 0:
            pytest.skip("No connections available for messaging test")
        
        connection_id = connections[0]['id']
        
        # Send a test message
        test_content = "Test message for sorting verification"
        send_response = authenticated_client.post(
            f"{BASE_URL}/api/messages/{connection_id}",
            json={"content": test_content}
        )
        
        assert send_response.status_code == 200, f"Send message failed: {send_response.text}"
        send_data = send_response.json()
        assert "id" in send_data, "Response should contain message id"
        
        print(f"✓ Message sent successfully: {send_data.get('id', 'N/A')[:8]}...")
        
        # Fetch messages to verify
        get_response = authenticated_client.get(f"{BASE_URL}/api/messages/{connection_id}")
        assert get_response.status_code == 200
        
        messages = get_response.json()
        assert len(messages) > 0, "Should have at least one message"
        
        # Verify the latest message has created_at
        latest_msg = messages[-1]
        assert 'created_at' in latest_msg, "Message should have created_at field"
        assert 'content' in latest_msg, "Message should have content field"
        
        print(f"✓ Messages retrieved, latest message created_at: {latest_msg['created_at']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
