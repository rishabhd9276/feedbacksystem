#!/usr/bin/env python3
"""
Test script to debug assignment visibility issue
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_assignments():
    print("Testing Assignment API...")
    
    # Test data
    test_manager = {
        "name": "Test Manager",
        "email": "testmanager@test.com",
        "password": "password123",
        "role": "manager"
    }
    
    test_employee = {
        "name": "Test Employee",
        "email": "testemployee@test.com",
        "password": "password123",
        "role": "employee",
        "manager_id": 1  # Will be set after manager creation
    }
    
    # Step 1: Register manager
    print("1. Registering manager...")
    manager_response = requests.post(f"{BASE_URL}/auth/register", json=test_manager)
    if manager_response.status_code == 200:
        manager_data = manager_response.json()
        print(f"   Manager created: {manager_data['name']} (ID: {manager_data['id']})")
        manager_id = manager_data['id']
    else:
        print(f"   Failed to create manager: {manager_response.text}")
        return
    
    # Step 2: Register employee
    print("2. Registering employee...")
    test_employee['manager_id'] = manager_id
    employee_response = requests.post(f"{BASE_URL}/auth/register", json=test_employee)
    if employee_response.status_code == 200:
        employee_data = employee_response.json()
        print(f"   Employee created: {employee_data['name']} (ID: {employee_data['id']})")
        employee_id = employee_data['id']
    else:
        print(f"   Failed to create employee: {employee_response.text}")
        return
    
    # Step 3: Login as manager
    print("3. Logging in as manager...")
    manager_login_data = {
        "username": test_manager["email"],
        "password": test_manager["password"]
    }
    manager_login_response = requests.post(f"{BASE_URL}/auth/login", data=manager_login_data)
    if manager_login_response.status_code == 200:
        manager_token = manager_login_response.json()["access_token"]
        print("   Manager login successful")
    else:
        print(f"   Manager login failed: {manager_login_response.text}")
        return
    
    # Step 4: Login as employee
    print("4. Logging in as employee...")
    employee_login_data = {
        "username": test_employee["email"],
        "password": test_employee["password"]
    }
    employee_login_response = requests.post(f"{BASE_URL}/auth/login", data=employee_login_data)
    if employee_login_response.status_code == 200:
        employee_token = employee_login_response.json()["access_token"]
        print("   Employee login successful")
    else:
        print(f"   Employee login failed: {employee_login_response.text}")
        return
    
    # Step 5: Check assignments before creating any
    print("5. Checking assignments before creation...")
    headers = {"Authorization": f"Bearer {employee_token}"}
    assignments_response = requests.get(f"{BASE_URL}/assignments/my", headers=headers)
    print(f"   Employee assignments: {assignments_response.status_code} - {assignments_response.text}")
    
    # Step 6: Create assignment as manager
    print("6. Creating assignment as manager...")
    manager_headers = {"Authorization": f"Bearer {manager_token}"}
    
    # Create a simple text file for testing
    assignment_data = {
        "title": "Test Assignment",
        "description": "This is a test assignment",
        "due_date": "2024-12-31T23:59:59"
    }
    
    # For file upload, we need to create a file
    import tempfile
    import os
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write("This is a test assignment file content.")
        temp_file_path = f.name
    
    try:
        with open(temp_file_path, 'rb') as f:
            files = {'file': ('test_assignment.txt', f, 'text/plain')}
            data = {
                'title': assignment_data['title'],
                'description': assignment_data['description'],
                'due_date': assignment_data['due_date']
            }
            
            assignment_response = requests.post(
                f"{BASE_URL}/assignments/upload",
                files=files,
                data=data,
                headers=manager_headers
            )
            
            if assignment_response.status_code == 200:
                assignment_data = assignment_response.json()
                print(f"   Assignment created: {assignment_data['title']} (ID: {assignment_data['id']})")
            else:
                print(f"   Failed to create assignment: {assignment_response.text}")
                return
    finally:
        os.unlink(temp_file_path)
    
    # Step 7: Check assignments after creation
    print("7. Checking assignments after creation...")
    assignments_response = requests.get(f"{BASE_URL}/assignments/my", headers=headers)
    print(f"   Employee assignments: {assignments_response.status_code} - {assignments_response.text}")
    
    # Step 8: Check team assignments as manager
    print("8. Checking team assignments as manager...")
    team_assignments_response = requests.get(f"{BASE_URL}/assignments/team", headers=manager_headers)
    print(f"   Team assignments: {team_assignments_response.status_code} - {team_assignments_response.text}")
    
    print("\nTest completed!")

if __name__ == "__main__":
    test_assignments() 