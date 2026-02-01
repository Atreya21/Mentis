#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class MentisAPITester:
    def __init__(self, base_url="https://mentismath.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.admin_id = None
        self.resource_id = None
        self.game_id = None
        self.fact_id = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def make_request(self, method, endpoint, data=None, headers=None, expected_status=200):
        """Make HTTP request and return response"""
        url = f"{self.api_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=default_headers)
            
            success = response.status_code == expected_status
            return success, response
        except Exception as e:
            print(f"Request error: {str(e)}")
            return False, None

    def test_auth_signup(self):
        """Test user signup"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "name": f"Test User {timestamp}",
            "email": f"testuser{timestamp}@example.com",
            "password": "testpass123"
        }
        
        success, response = self.make_request('POST', 'auth/signup', user_data, expected_status=200)
        if success and response:
            data = response.json()
            self.token = data.get('access_token')
            self.user_id = data.get('user', {}).get('id')
            return self.log_test("User Signup", True, f"Token: {self.token[:20]}...")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            return self.log_test("User Signup", False, f"Error: {error_msg}")

    def test_auth_login(self):
        """Test user login with existing credentials"""
        if not self.token:
            return self.log_test("User Login", False, "No signup token available")
        
        # Try to login with same credentials used in signup
        timestamp = datetime.now().strftime('%H%M%S')
        login_data = {
            "email": f"testuser{timestamp}@example.com",
            "password": "testpass123"
        }
        
        success, response = self.make_request('POST', 'auth/login', login_data, expected_status=200)
        if success and response:
            data = response.json()
            login_token = data.get('access_token')
            return self.log_test("User Login", True, f"Login successful")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            return self.log_test("User Login", False, f"Error: {error_msg}")

    def test_auth_me(self):
        """Test get current user"""
        if not self.token:
            return self.log_test("Get Current User", False, "No auth token")
        
        headers = {'Authorization': f'Bearer {self.token}'}
        success, response = self.make_request('GET', 'auth/me', headers=headers, expected_status=200)
        
        if success and response:
            user_data = response.json()
            return self.log_test("Get Current User", True, f"User: {user_data.get('name')}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            return self.log_test("Get Current User", False, f"Error: {error_msg}")

    def test_create_resource(self):
        """Test creating a resource"""
        if not self.token:
            return self.log_test("Create Resource", False, "No auth token")
        
        resource_data = {
            "title": "Test Calculus Notes",
            "description": "Comprehensive calculus notes for beginners",
            "content_type": "notes",
            "url": "https://example.com/calculus-notes",
            "topic": "Calculus"
        }
        
        headers = {'Authorization': f'Bearer {self.token}'}
        success, response = self.make_request('POST', 'resources', resource_data, headers=headers, expected_status=200)
        
        if success and response:
            data = response.json()
            self.resource_id = data.get('id')
            return self.log_test("Create Resource", True, f"Resource ID: {self.resource_id}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            return self.log_test("Create Resource", False, f"Error: {error_msg}")

    def test_get_resources(self):
        """Test getting resources"""
        success, response = self.make_request('GET', 'resources', expected_status=200)
        
        if success and response:
            resources = response.json()
            return self.log_test("Get Resources", True, f"Found {len(resources)} resources")
        else:
            return self.log_test("Get Resources", False, "Failed to fetch resources")

    def test_get_resources_pending(self):
        """Test getting pending resources"""
        success, response = self.make_request('GET', 'resources?status=pending', expected_status=200)
        
        if success and response:
            resources = response.json()
            return self.log_test("Get Pending Resources", True, f"Found {len(resources)} pending resources")
        else:
            return self.log_test("Get Pending Resources", False, "Failed to fetch pending resources")

    def test_get_games(self):
        """Test getting games"""
        success, response = self.make_request('GET', 'games', expected_status=200)
        
        if success and response:
            games = response.json()
            return self.log_test("Get Games", True, f"Found {len(games)} games")
        else:
            return self.log_test("Get Games", False, "Failed to fetch games")

    def test_get_curiofacts(self):
        """Test getting curiofacts"""
        success, response = self.make_request('GET', 'curiofacts', expected_status=200)
        
        if success and response:
            facts = response.json()
            return self.log_test("Get Curiofacts", True, f"Found {len(facts)} curiofacts")
        else:
            return self.log_test("Get Curiofacts", False, "Failed to fetch curiofacts")

    def test_matrix_register(self):
        """Test matrix registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        registration_data = {
            "name": f"Matrix User {timestamp}",
            "email": f"matrix{timestamp}@example.com",
            "college": "Test University",
            "interests": "Linear Algebra, Graph Theory"
        }
        
        success, response = self.make_request('POST', 'matrix/register', registration_data, expected_status=200)
        
        if success and response:
            data = response.json()
            return self.log_test("Matrix Registration", True, f"Registered: {data.get('name')}")
        else:
            error_msg = response.json().get('detail', 'Unknown error') if response else 'No response'
            return self.log_test("Matrix Registration", False, f"Error: {error_msg}")

    def test_matrix_stats(self):
        """Test getting matrix stats"""
        success, response = self.make_request('GET', 'matrix/stats', expected_status=200)
        
        if success and response:
            stats = response.json()
            members = stats.get('total_members', 0)
            colleges = stats.get('total_colleges', 0)
            return self.log_test("Matrix Stats", True, f"Members: {members}, Colleges: {colleges}")
        else:
            return self.log_test("Matrix Stats", False, "Failed to fetch stats")

    def test_admin_functions(self):
        """Test admin-only functions (will likely fail since we don't have admin user)"""
        if not self.token:
            return self.log_test("Admin Functions", False, "No auth token")
        
        # Try to approve a resource (should fail with 403)
        if self.resource_id:
            headers = {'Authorization': f'Bearer {self.token}'}
            success, response = self.make_request('PATCH', f'resources/{self.resource_id}', 
                                                {'status': 'approved'}, headers=headers, expected_status=403)
            if response and response.status_code == 403:
                return self.log_test("Admin Resource Approval", True, "Correctly denied non-admin access")
            else:
                return self.log_test("Admin Resource Approval", False, "Should have been denied")
        
        # Try to create a game (should fail with 403)
        game_data = {
            "title": "Test Math Game",
            "description": "A fun math game",
            "url": "https://example.com/game",
            "difficulty": "easy"
        }
        headers = {'Authorization': f'Bearer {self.token}'}
        success, response = self.make_request('POST', 'games', game_data, headers=headers, expected_status=403)
        if response and response.status_code == 403:
            return self.log_test("Admin Game Creation", True, "Correctly denied non-admin access")
        else:
            return self.log_test("Admin Game Creation", False, "Should have been denied")

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Mentis Backend API Tests")
        print("=" * 50)
        
        # Authentication tests
        self.test_auth_signup()
        self.test_auth_login()
        self.test_auth_me()
        
        # Resource tests
        self.test_create_resource()
        self.test_get_resources()
        self.test_get_resources_pending()
        
        # Games and Curiofacts tests
        self.test_get_games()
        self.test_get_curiofacts()
        
        # Matrix tests
        self.test_matrix_register()
        self.test_matrix_stats()
        
        # Admin function tests
        self.test_admin_functions()
        
        # Print summary
        print("\n" + "=" * 50)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = MentisAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())