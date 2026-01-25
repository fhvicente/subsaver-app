#!/usr/bin/env python3
"""
Debug authentication issues
"""

import requests
import json

BASE_URL = "https://subsaver-25.preview.emergentagent.com/api"

def test_duplicate_registration():
    print("Testing duplicate registration...")
    data = {"email": "test@example.com", "password": "test123456"}
    
    response = requests.post(f"{BASE_URL}/auth/register", json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    print(f"Headers: {response.headers}")

def test_wrong_password():
    print("\nTesting wrong password...")
    data = {"email": "test@example.com", "password": "wrongpassword"}
    
    response = requests.post(f"{BASE_URL}/auth/login", json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")

def test_no_auth():
    print("\nTesting no auth token...")
    response = requests.get(f"{BASE_URL}/user/profile")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")

if __name__ == "__main__":
    test_duplicate_registration()
    test_wrong_password()
    test_no_auth()