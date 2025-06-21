#!/usr/bin/env python3
"""
Simple test script to verify announcement functionality
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_announcements():
    print("Testing Announcement API...")
    
    # Test data
    test_manager = {
        "name": "Test Manager",
        "email": "manager@test.com",
        "password": "password123",
        "role": "manager"
    }
    
    test_employee = {
        "name": "Test Employee",
        "email": "employee@test.com",
        "password": "password123",
        "role": "employee",
        "manager_id": 1  # Will be set after manager creation
    }
    
    test_announcement = {
        "title": "New Project Launch",
        "content": "We are excited to announce the launch of our new project. Please review the requirements and let me know if you have any questions."
    }
    
    try:
        # 1. Register manager
        print("1. Registering manager...")
        manager_response = requests.post(f"{BASE_URL}/auth/register", json=test_manager)
        if manager_response.status_code == 200:
            print("✓ Manager registered successfully")
            manager_data = manager_response.json()
            manager_id = manager_data["id"]
        else:
            print(f"✗ Failed to register manager: {manager_response.text}")
            return
        
        # 2. Register employee
        print("2. Registering employee...")
        test_employee["manager_id"] = manager_id
        employee_response = requests.post(f"{BASE_URL}/auth/register", json=test_employee)
        if employee_response.status_code == 200:
            print("✓ Employee registered successfully")
            employee_data = employee_response.json()
            employee_id = employee_data["id"]
        else:
            print(f"✗ Failed to register employee: {employee_response.text}")
            return
        
        # 3. Login as manager
        print("3. Logging in as manager...")
        manager_login = requests.post(f"{BASE_URL}/auth/login", data={
            "username": test_manager["email"],
            "password": test_manager["password"]
        })
        if manager_login.status_code == 200:
            print("✓ Manager login successful")
            manager_token = manager_login.json()["access_token"]
            manager_headers = {"Authorization": f"Bearer {manager_token}"}
        else:
            print(f"✗ Failed to login as manager: {manager_login.text}")
            return
        
        # 4. Create announcement
        print("4. Creating announcement...")
        announcement_response = requests.post(
            f"{BASE_URL}/announcements/",
            json=test_announcement,
            headers=manager_headers
        )
        if announcement_response.status_code == 200:
            print("✓ Announcement created successfully")
            announcement_data = announcement_response.json()
            announcement_id = announcement_data["id"]
        else:
            print(f"✗ Failed to create announcement: {announcement_response.text}")
            return
        
        # 5. Get team announcements (manager view)
        print("5. Getting team announcements (manager view)...")
        team_announcements = requests.get(f"{BASE_URL}/announcements/team", headers=manager_headers)
        if team_announcements.status_code == 200:
            print("✓ Team announcements retrieved successfully")
            announcements = team_announcements.json()
            print(f"   Found {len(announcements)} announcements")
        else:
            print(f"✗ Failed to get team announcements: {team_announcements.text}")
            return
        
        # 6. Login as employee
        print("6. Logging in as employee...")
        employee_login = requests.post(f"{BASE_URL}/auth/login", data={
            "username": test_employee["email"],
            "password": test_employee["password"]
        })
        if employee_login.status_code == 200:
            print("✓ Employee login successful")
            employee_token = employee_login.json()["access_token"]
            employee_headers = {"Authorization": f"Bearer {employee_token}"}
        else:
            print(f"✗ Failed to login as employee: {employee_login.text}")
            return
        
        # 7. Get employee announcements
        print("7. Getting employee announcements...")
        employee_announcements = requests.get(f"{BASE_URL}/announcements/my", headers=employee_headers)
        if employee_announcements.status_code == 200:
            print("✓ Employee announcements retrieved successfully")
            emp_announcements = employee_announcements.json()
            print(f"   Found {len(emp_announcements)} announcements")
        else:
            print(f"✗ Failed to get employee announcements: {employee_announcements.text}")
            return
        
        # 8. Update announcement
        print("8. Updating announcement...")
        update_data = {
            "title": "Updated: New Project Launch",
            "content": "We are excited to announce the launch of our new project. Please review the requirements and let me know if you have any questions. Additional details will be shared in the next meeting."
        }
        update_response = requests.patch(
            f"{BASE_URL}/announcements/{announcement_id}",
            json=update_data,
            headers=manager_headers
        )
        if update_response.status_code == 200:
            print("✓ Announcement updated successfully")
        else:
            print(f"✗ Failed to update announcement: {update_response.text}")
            return
        
        # 9. Get specific announcement
        print("9. Getting specific announcement...")
        specific_announcement = requests.get(f"{BASE_URL}/announcements/{announcement_id}", headers=employee_headers)
        if specific_announcement.status_code == 200:
            print("✓ Specific announcement retrieved successfully")
            announcement = specific_announcement.json()
            print(f"   Title: {announcement['title']}")
            print(f"   Manager: {announcement['manager_name']}")
        else:
            print(f"✗ Failed to get specific announcement: {specific_announcement.text}")
            return
        
        print("\n🎉 All announcement tests passed successfully!")
        
    except requests.exceptions.ConnectionError:
        print("✗ Could not connect to the server. Make sure the backend is running on http://localhost:8000")
    except Exception as e:
        print(f"✗ Test failed with error: {str(e)}")

if __name__ == "__main__":
    test_announcements() 