#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Subscription Manager
Tests all authentication, user profile, subscription CRUD, and analytics endpoints
"""

import requests
import json
from datetime import datetime, timedelta
import sys

# Configuration
BASE_URL = "https://subsaver-25.preview.emergentagent.com/api"
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "test123456"

class SubscriptionManagerTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.auth_token = None
        self.user_id = None
        self.subscription_ids = []
        self.test_results = []
        
    def log_result(self, test_name, success, message="", response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data
        })
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        default_headers = {"Content-Type": "application/json"}
        
        if headers:
            default_headers.update(headers)
            
        if self.auth_token and "Authorization" not in default_headers:
            default_headers["Authorization"] = f"Bearer {self.auth_token}"
            
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=default_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== Testing User Registration ===")
        
        # Test successful registration
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = self.make_request("POST", "/auth/register", data)
        
        if response and response.status_code == 200:
            response_data = response.json()
            if "access_token" in response_data and "user" in response_data:
                self.auth_token = response_data["access_token"]
                self.user_id = response_data["user"]["id"]
                self.log_result("User Registration", True, 
                              f"User registered successfully. Token received, User ID: {self.user_id}", 
                              response_data)
            else:
                self.log_result("User Registration", False, 
                              "Registration response missing required fields", response_data)
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_result("User Registration", False, 
                          f"Registration failed: {error_msg}")
    
    def test_duplicate_registration(self):
        """Test duplicate email registration (should fail)"""
        print("\n=== Testing Duplicate Registration ===")
        
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = self.make_request("POST", "/auth/register", data)
        
        if response and response.status_code == 400:
            error_data = response.json()
            if "already registered" in error_data.get("detail", "").lower():
                self.log_result("Duplicate Registration Prevention", True, 
                              "Correctly prevented duplicate registration")
            else:
                self.log_result("Duplicate Registration Prevention", False, 
                              f"Wrong error message: {error_data.get('detail')}")
        else:
            self.log_result("Duplicate Registration Prevention", False, 
                          "Should have failed with 400 status code")
    
    def test_user_login(self):
        """Test user login endpoint"""
        print("\n=== Testing User Login ===")
        
        # Test successful login
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        
        response = self.make_request("POST", "/auth/login", data)
        
        if response and response.status_code == 200:
            response_data = response.json()
            if "access_token" in response_data and "user" in response_data:
                self.auth_token = response_data["access_token"]
                self.log_result("User Login", True, 
                              "Login successful, JWT token received", response_data)
            else:
                self.log_result("User Login", False, 
                              "Login response missing required fields", response_data)
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_result("User Login", False, f"Login failed: {error_msg}")
    
    def test_wrong_password_login(self):
        """Test login with wrong password (should fail)"""
        print("\n=== Testing Wrong Password Login ===")
        
        data = {
            "email": TEST_EMAIL,
            "password": "wrongpassword"
        }
        
        response = self.make_request("POST", "/auth/login", data)
        
        if response and response.status_code == 401:
            self.log_result("Wrong Password Prevention", True, 
                          "Correctly rejected wrong password")
        else:
            self.log_result("Wrong Password Prevention", False, 
                          "Should have failed with 401 status code")
    
    def test_get_user_profile(self):
        """Test get user profile endpoint"""
        print("\n=== Testing Get User Profile ===")
        
        response = self.make_request("GET", "/user/profile")
        
        if response and response.status_code == 200:
            profile_data = response.json()
            required_fields = ["id", "email", "currency", "timezone", "created_at"]
            
            if all(field in profile_data for field in required_fields):
                self.log_result("Get User Profile", True, 
                              f"Profile retrieved successfully. Currency: {profile_data['currency']}", 
                              profile_data)
            else:
                missing_fields = [f for f in required_fields if f not in profile_data]
                self.log_result("Get User Profile", False, 
                              f"Missing fields: {missing_fields}", profile_data)
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_result("Get User Profile", False, f"Failed to get profile: {error_msg}")
    
    def test_update_user_profile(self):
        """Test update user profile endpoint"""
        print("\n=== Testing Update User Profile ===")
        
        data = {
            "currency": "EUR"
        }
        
        response = self.make_request("PUT", "/user/profile", data)
        
        if response and response.status_code == 200:
            profile_data = response.json()
            if profile_data.get("currency") == "EUR":
                self.log_result("Update User Profile", True, 
                              "Profile updated successfully to EUR", profile_data)
            else:
                self.log_result("Update User Profile", False, 
                              f"Currency not updated correctly: {profile_data.get('currency')}")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_result("Update User Profile", False, f"Failed to update profile: {error_msg}")
    
    def test_unauthorized_access(self):
        """Test accessing protected endpoints without token"""
        print("\n=== Testing Unauthorized Access ===")
        
        # Temporarily remove auth token
        original_token = self.auth_token
        self.auth_token = None
        
        response = self.make_request("GET", "/user/profile")
        
        if response and response.status_code == 401:
            self.log_result("Unauthorized Access Prevention", True, 
                          "Correctly rejected request without auth token")
        else:
            self.log_result("Unauthorized Access Prevention", False, 
                          "Should have failed with 401 status code")
        
        # Restore auth token
        self.auth_token = original_token
    
    def test_create_subscriptions(self):
        """Test creating multiple subscriptions"""
        print("\n=== Testing Create Subscriptions ===")
        
        # Calculate future dates
        future_date_1 = (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d")
        future_date_2 = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        future_date_3 = (datetime.now() + timedelta(days=25)).strftime("%Y-%m-%d")
        
        subscriptions = [
            {
                "service_name": "Netflix",
                "price": 15.99,
                "renewal_date": future_date_1,
                "category": "Streaming"
            },
            {
                "service_name": "Spotify",
                "price": 9.99,
                "renewal_date": future_date_2,
                "category": "Music"
            },
            {
                "service_name": "GitHub",
                "price": 4.00,
                "renewal_date": future_date_3,
                "category": "Productivity"
            }
        ]
        
        for i, sub_data in enumerate(subscriptions):
            response = self.make_request("POST", "/subscriptions", sub_data)
            
            if response and response.status_code == 200:
                subscription = response.json()
                if "id" in subscription:
                    self.subscription_ids.append(subscription["id"])
                    self.log_result(f"Create Subscription {i+1} ({sub_data['service_name']})", True, 
                                  f"Created successfully. ID: {subscription['id']}", subscription)
                else:
                    self.log_result(f"Create Subscription {i+1} ({sub_data['service_name']})", False, 
                                  "Response missing subscription ID", subscription)
            else:
                error_msg = response.json().get("detail", "Unknown error") if response else "No response"
                self.log_result(f"Create Subscription {i+1} ({sub_data['service_name']})", False, 
                              f"Failed to create: {error_msg}")
    
    def test_get_all_subscriptions(self):
        """Test getting all subscriptions"""
        print("\n=== Testing Get All Subscriptions ===")
        
        response = self.make_request("GET", "/subscriptions")
        
        if response and response.status_code == 200:
            subscriptions = response.json()
            if isinstance(subscriptions, list) and len(subscriptions) >= 3:
                self.log_result("Get All Subscriptions", True, 
                              f"Retrieved {len(subscriptions)} subscriptions", 
                              {"count": len(subscriptions)})
            else:
                self.log_result("Get All Subscriptions", False, 
                              f"Expected at least 3 subscriptions, got {len(subscriptions) if isinstance(subscriptions, list) else 'invalid response'}")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_result("Get All Subscriptions", False, f"Failed to get subscriptions: {error_msg}")
    
    def test_get_single_subscription(self):
        """Test getting a single subscription"""
        print("\n=== Testing Get Single Subscription ===")
        
        if not self.subscription_ids:
            self.log_result("Get Single Subscription", False, "No subscription IDs available for testing")
            return
        
        subscription_id = self.subscription_ids[0]
        response = self.make_request("GET", f"/subscriptions/{subscription_id}")
        
        if response and response.status_code == 200:
            subscription = response.json()
            required_fields = ["id", "service_name", "price", "renewal_date", "monthly_cost", "annual_cost", "days_until_renewal"]
            
            if all(field in subscription for field in required_fields):
                self.log_result("Get Single Subscription", True, 
                              f"Retrieved subscription: {subscription['service_name']}", subscription)
            else:
                missing_fields = [f for f in required_fields if f not in subscription]
                self.log_result("Get Single Subscription", False, 
                              f"Missing fields: {missing_fields}")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_result("Get Single Subscription", False, f"Failed to get subscription: {error_msg}")
    
    def test_update_subscription(self):
        """Test updating a subscription"""
        print("\n=== Testing Update Subscription ===")
        
        if not self.subscription_ids:
            self.log_result("Update Subscription", False, "No subscription IDs available for testing")
            return
        
        subscription_id = self.subscription_ids[0]
        update_data = {
            "price": 19.99
        }
        
        response = self.make_request("PUT", f"/subscriptions/{subscription_id}", update_data)
        
        if response and response.status_code == 200:
            subscription = response.json()
            if subscription.get("price") == 19.99:
                self.log_result("Update Subscription", True, 
                              f"Price updated to ${subscription['price']}", subscription)
            else:
                self.log_result("Update Subscription", False, 
                              f"Price not updated correctly: ${subscription.get('price')}")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_result("Update Subscription", False, f"Failed to update subscription: {error_msg}")
    
    def test_dashboard_analytics(self):
        """Test dashboard analytics endpoint"""
        print("\n=== Testing Dashboard Analytics ===")
        
        response = self.make_request("GET", "/subscriptions/analytics/dashboard")
        
        if response and response.status_code == 200:
            analytics = response.json()
            required_fields = ["total_subscriptions", "monthly_spend", "annual_spend", "category_breakdown"]
            
            if all(field in analytics for field in required_fields):
                # Verify calculations
                total_subs = analytics["total_subscriptions"]
                monthly_spend = analytics["monthly_spend"]
                annual_spend = analytics["annual_spend"]
                category_breakdown = analytics["category_breakdown"]
                next_renewal = analytics.get("next_renewal")
                
                # Basic validation
                if total_subs >= 3 and monthly_spend > 0 and annual_spend > 0:
                    self.log_result("Dashboard Analytics", True, 
                                  f"Analytics: {total_subs} subs, ${monthly_spend}/month, ${annual_spend}/year", 
                                  analytics)
                else:
                    self.log_result("Dashboard Analytics", False, 
                                  f"Invalid calculations: {total_subs} subs, ${monthly_spend}/month, ${annual_spend}/year")
            else:
                missing_fields = [f for f in required_fields if f not in analytics]
                self.log_result("Dashboard Analytics", False, 
                              f"Missing fields: {missing_fields}")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_result("Dashboard Analytics", False, f"Failed to get analytics: {error_msg}")
    
    def test_invalid_subscription_data(self):
        """Test creating subscription with invalid data"""
        print("\n=== Testing Invalid Subscription Data ===")
        
        # Test negative price
        invalid_data = {
            "service_name": "Invalid Service",
            "price": -10.00,
            "renewal_date": "2025-12-31",
            "category": "Test"
        }
        
        response = self.make_request("POST", "/subscriptions", invalid_data)
        
        # Note: The current backend doesn't validate negative prices, so this might pass
        # We'll report what actually happens
        if response:
            if response.status_code == 400:
                self.log_result("Invalid Subscription Data (Negative Price)", True, 
                              "Correctly rejected negative price")
            else:
                self.log_result("Invalid Subscription Data (Negative Price)", False, 
                              f"Should validate negative price (got status {response.status_code})")
        else:
            self.log_result("Invalid Subscription Data (Negative Price)", False, "No response received")
    
    def test_delete_subscription(self):
        """Test deleting a subscription"""
        print("\n=== Testing Delete Subscription ===")
        
        if not self.subscription_ids:
            self.log_result("Delete Subscription", False, "No subscription IDs available for testing")
            return
        
        # Delete the last subscription
        subscription_id = self.subscription_ids[-1]
        response = self.make_request("DELETE", f"/subscriptions/{subscription_id}")
        
        if response and response.status_code == 200:
            result = response.json()
            if "deleted successfully" in result.get("message", "").lower():
                self.subscription_ids.remove(subscription_id)
                self.log_result("Delete Subscription", True, 
                              f"Subscription deleted successfully", result)
            else:
                self.log_result("Delete Subscription", False, 
                              f"Unexpected delete response: {result}")
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            self.log_result("Delete Subscription", False, f"Failed to delete subscription: {error_msg}")
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Subscription Manager Backend API Tests")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Authentication Tests
        self.test_user_registration()
        self.test_duplicate_registration()
        self.test_user_login()
        self.test_wrong_password_login()
        
        # User Profile Tests
        self.test_get_user_profile()
        self.test_update_user_profile()
        
        # Authorization Tests
        self.test_unauthorized_access()
        
        # Subscription CRUD Tests
        self.test_create_subscriptions()
        self.test_get_all_subscriptions()
        self.test_get_single_subscription()
        self.test_update_subscription()
        
        # Analytics Tests
        self.test_dashboard_analytics()
        
        # Error Handling Tests
        self.test_invalid_subscription_data()
        
        # Cleanup Tests
        self.test_delete_subscription()
        
        # Summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['message']}")
        
        print("\n" + "=" * 60)

if __name__ == "__main__":
    tester = SubscriptionManagerTester()
    tester.run_all_tests()