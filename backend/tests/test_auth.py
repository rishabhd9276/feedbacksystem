from fastapi.testclient import TestClient

# Reusable user data
TEST_USER = {
    "name": "Test User",
    "email": "test@example.com",
    "password": "testpassword123",
    "role": "employee"
}

def test_successful_registration(test_client: TestClient):
    """
    Tests that a new user can be registered successfully.
    """
    response = test_client.post("/auth/register", json=TEST_USER)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == TEST_USER["email"]
    assert "id" in data
    assert "password_hash" not in data # Ensure password is not returned

def test_registration_with_existing_email(test_client: TestClient):
    """
    Tests that registering with a duplicate email fails.
    """
    # First, create the user
    test_client.post("/auth/register", json=TEST_USER)

    # Then, try to create the same user again
    response = test_client.post("/auth/register", json=TEST_USER)
    assert response.status_code == 400
    assert response.json() == {"detail": "Email already registered"}

def test_successful_login(test_client: TestClient):
    """
    Tests that a registered user can log in successfully.
    """
    # First, register the user
    test_client.post("/auth/register", json=TEST_USER)

    # Now, attempt to log in
    login_data = {
        "username": TEST_USER["email"],
        "password": TEST_USER["password"]
    }
    response = test_client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_with_incorrect_password(test_client: TestClient):
    """
    Tests that logging in with an incorrect password fails.
    """
    # First, register the user
    test_client.post("/auth/register", json=TEST_USER)

    # Now, attempt to log in with the wrong password
    login_data = {
        "username": TEST_USER["email"],
        "password": "wrongpassword"
    }
    response = test_client.post("/auth/login", data=login_data)
    assert response.status_code == 400
    assert response.json() == {"detail": "Incorrect email or password"}

def test_login_with_nonexistent_user(test_client: TestClient):
    """
    Tests that logging in with an email that does not exist fails.
    """
    login_data = {
        "username": "nosuchuser@example.com",
        "password": "anypassword"
    }
    response = test_client.post("/auth/login", data=login_data)
    assert response.status_code == 400
    assert response.json() == {"detail": "Incorrect email or password"} 