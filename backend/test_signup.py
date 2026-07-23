import requests

def test_signup():
    url = "http://127.0.0.1:5000/api/auth/signup"
    payload = {
        "fullName": "Test User",
        "email": "testsignup@example.com",
        "password": "password123",
        "role": "Patient"
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_signup()
